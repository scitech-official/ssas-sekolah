const axios = require('axios');
const prisma = require('../config/prisma');

/**
 * Format phone number to Indonesian international format (628xxx)
 */
function formatPhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Format WA message template with variables
 */
function compileMessage(template, { name, status, time, date, className, note }) {
  let message = template || '';
  message = message.replace(/\[NAMA\]/gi, name || '-');
  message = message.replace(/\[STATUS\]/gi, status || '-');
  message = message.replace(/\[JAM\]/gi, time || '-');
  message = message.replace(/\[TANGGAL\]/gi, date || '-');
  message = message.replace(/\[KELAS\]/gi, className || '-');
  message = message.replace(/\[CATATAN\]/gi, note ? `\nCatatan: ${note}` : '');
  return message;
}

/**
 * Send WhatsApp Message via Fonnte API or Mock Simulator
 */
async function sendWhatsAppMessage({ studentId, target, message, tokenOverride, mockOverride }) {
  const settings = await prisma.setting.findUnique({ where: { id: 1 } });
  const isMock = mockOverride !== undefined ? mockOverride : (settings?.fonnteMockMode ?? true);
  const token = tokenOverride || settings?.fonnteApiToken || process.env.FONNTE_API_TOKEN || '';
  const formattedTarget = formatPhoneNumber(target);

  // If Mock Mode is enabled or token is missing, simulate message sending
  if (isMock || !token) {
    const mockReason = isMock ? 'MOCK_MODE_ENABLED' : 'FONNTE_TOKEN_EMPTY';
    console.log(`\n💬 [FONNTE SIMULATOR]`);
    console.log(`📱 To: ${formattedTarget}`);
    console.log(`📝 Status: SIMULATED (${mockReason})`);
    console.log(`✉️ Message:\n${message}\n-----------------------------`);

    // Record in WaLog for inspection
    await prisma.waLog.create({
      data: {
        studentId: studentId || null,
        recipient: formattedTarget,
        message,
        status: 'MOCK',
        response: `Pesan disimulasikan (${mockReason})`,
      },
    }).catch(err => console.warn('Could not write WaLog:', err.message));

    return {
      success: true,
      mock: true,
      status: 'MOCK_SENT',
      message: 'Pesan berhasil disimulasikan (Mock Mode). Kuota Fonnte aman.',
    };
  }

  // Live Fonnte API call
  try {
    const response = await axios.post(
      'https://api.fonnte.com/send',
      {
        target: formattedTarget,
        message: message,
        countryCode: '62',
      },
      {
        headers: {
          Authorization: token,
        },
        timeout: 10000,
      }
    );

    const isSuccess = response.data?.status === true || response.status === 200;

    await prisma.waLog.create({
      data: {
        studentId: studentId || null,
        recipient: formattedTarget,
        message,
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        response: JSON.stringify(response.data),
      },
    }).catch(err => console.warn('Could not write WaLog:', err.message));

    return {
      success: isSuccess,
      mock: false,
      status: isSuccess ? 'SENT' : 'FAILED',
      data: response.data,
    };
  } catch (error) {
    console.error('❌ [FONNTE API ERROR]:', error.response?.data || error.message);

    await prisma.waLog.create({
      data: {
        studentId: studentId || null,
        recipient: formattedTarget,
        message,
        status: 'FAILED',
        response: error.response?.data ? JSON.stringify(error.response.data) : error.message,
      },
    }).catch(err => console.warn('Could not write WaLog:', err.message));

    return {
      success: false,
      mock: false,
      status: 'FAILED',
      error: error.response?.data || error.message,
    };
  }
}

module.exports = {
  formatPhoneNumber,
  compileMessage,
  sendWhatsAppMessage,
};
