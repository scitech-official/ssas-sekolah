const { sendWhatsAppMessage } = require('./fonnteService');
const prisma = require('../config/prisma');

class MessageQueueWorker {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.rateLimitMs = 350; // ~3 messages per second (safe within 2-5 msg/sec)
    this.stats = {
      enqueued: 0,
      processed: 0,
      failed: 0,
      retried: 0,
    };
  }

  /**
   * Push a message task to queue
   * @param {Object} job
   * @param {string} job.attendanceId - Optional attendance record ID to update status
   * @param {string} job.studentId
   * @param {string} job.target - Phone number
   * @param {string} job.message - Compiled message text
   * @param {number} job.retries - Current retry count
   */
  enqueue(job) {
    const task = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      retries: 0,
      maxRetries: 3,
      enqueuedAt: new Date(),
      ...job,
    };
    this.queue.push(task);
    this.stats.enqueued++;

    // Start processing loop if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return task.id;
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const job = this.queue.shift();

    try {
      const result = await sendWhatsAppMessage({
        studentId: job.studentId,
        target: job.target,
        message: job.message,
      });

      if (result.success) {
        this.stats.processed++;
        // Update attendance record waStatus
        if (job.attendanceId) {
          await prisma.attendance.update({
            where: { id: job.attendanceId },
            data: {
              waSent: true,
              waStatus: result.status || 'SENT',
            },
          }).catch(err => console.warn('Attendance update error:', err.message));
        }
      } else {
        throw new Error(result.error ? JSON.stringify(result.error) : 'Fonnte sending failed');
      }
    } catch (error) {
      console.warn(`⚠️ Queue job failed (${job.id}): ${error.message}`);
      job.retries = (job.retries || 0) + 1;

      if (job.retries <= job.maxRetries) {
        this.stats.retried++;
        // Exponential backoff delay: 1s, 2s, 4s
        const backoffDelay = Math.pow(2, job.retries - 1) * 1000;
        console.log(`🔄 Re-queueing job in ${backoffDelay}ms (attempt ${job.retries}/${job.maxRetries})...`);
        setTimeout(() => {
          this.queue.push(job);
          if (!this.isProcessing) this.processQueue();
        }, backoffDelay);
      } else {
        this.stats.failed++;
        console.error(`❌ Job exceeded max retries: ${job.id}`);
        if (job.attendanceId) {
          await prisma.attendance.update({
            where: { id: job.attendanceId },
            data: {
              waSent: false,
              waStatus: 'FAILED',
            },
          }).catch(err => console.warn('Attendance update error:', err.message));
        }
      }
    }

    // Wait rate limit before processing next message
    setTimeout(() => {
      this.processQueue();
    }, this.rateLimitMs);
  }

  getMetrics() {
    return {
      pending: this.queue.length,
      isProcessing: this.isProcessing,
      stats: { ...this.stats },
    };
  }
}

const queueWorker = new MessageQueueWorker();
module.exports = queueWorker;
