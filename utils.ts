import { Transaction, Account, Investment, Debt, Goal, AppMetadata, Lending } from './types';

// Global Configuration State
let currencyConfig = {
    code: 'INR',
    locale: 'en-IN',
    rate: 1
};

export const CURRENCY_OPTIONS = [
    { code: 'INR', name: 'Indian Rupee', locale: 'en-IN', symbol: '₹' },
    { code: 'USD', name: 'US Dollar', locale: 'en-US', symbol: '$' },
    { code: 'EUR', name: 'Euro', locale: 'de-DE', symbol: '€' },
    { code: 'GBP', name: 'British Pound', locale: 'en-GB', symbol: '£' },
    { code: 'BDT', name: 'Bangladeshi Taka', locale: 'bn-BD', symbol: '৳' },
    { code: 'CAD', name: 'Canadian Dollar', locale: 'en-CA', symbol: 'CA$' },
    { code: 'AUD', name: 'Australian Dollar', locale: 'en-AU', symbol: 'A$' },
    { code: 'JPY', name: 'Japanese Yen', locale: 'ja-JP', symbol: '¥' },
    { code: 'AED', name: 'UAE Dirham', locale: 'en-AE', symbol: 'dh' },
];

export function setCurrencyConfig(code: string, rate: number) {
    const option = CURRENCY_OPTIONS.find(c => c.code === code) || CURRENCY_OPTIONS[0];
    currencyConfig = {
        code: code,
        locale: option.locale,
        rate: rate > 0 ? rate : 1
    };
}

export function formatCurrency(amount: number | string | undefined | null): string {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (amount === undefined || amount === null || isNaN(val as number)) return formatValue(0);
  
  // Apply conversion rate
  const convertedValue = (val as number) * currencyConfig.rate;
  return formatValue(convertedValue);
}

function formatValue(val: number): string {
    return new Intl.NumberFormat(currencyConfig.locale, {
        style: 'currency',
        currency: currencyConfig.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
    }).format(val);
}

export function formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    // Use the currency locale for date formatting as well for consistency
    return new Date(dateString).toLocaleDateString(currencyConfig.locale, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

export function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

export function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
}

// --- AI Context Generation ---
export function generateAIContext(
    transactions: Transaction[],
    accounts: Account[],
    investments: Investment[],
    debts: Debt[],
    goals: Goal[],
    lendings: Lending[],
    appMetadata: AppMetadata,
    incomeCategories: string[],
    expenseCategories: string[],
    accountTypes: string[],
    investmentTypes: string[],
    debtTypes: string[],
    totalNetWorth: number,
    totalDebtValue: number,
    monthlyMetrics: any
) {
    const sortedTxns = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstTxnDate = sortedTxns.length > 0 ? sortedTxns[0].date : "No transactions yet";
    const lastTxnDate = sortedTxns.length > 0 ? sortedTxns[sortedTxns.length - 1].date : "No transactions yet";
    
    // Calculate total money lent out that is yet to be repaid
    const totalLentActive = lendings.reduce((sum, l) => {
        const repaid = l.payments.reduce((pSum, p) => pSum + p.amount, 0);
        return sum + Math.max(0, l.totalAmount - repaid);
    }, 0);

    return {
        meta: {
            appName: "FinTrackPro",
            appRegisteredDate: appMetadata.createdAt,
            dataLastEdited: appMetadata.lastModified,
            currentTimestamp: new Date().toISOString(),
            currency: currencyConfig.code,
            totalDataPoints: {
                transactions: transactions.length,
                accounts: accounts.length,
                investments: investments.length,
                debts: debts.length,
                goals: goals.length,
                lendings: lendings.length
            }
        },
        configuration: {
            customIncomeCategories: incomeCategories,
            customExpenseCategories: expenseCategories,
            customAccountTypes: accountTypes,
            customInvestmentTypes: investmentTypes,
            customDebtTypes: debtTypes
        },
        financialSummary: {
            netWorth: totalNetWorth * currencyConfig.rate,
            totalLiabilities: totalDebtValue * currencyConfig.rate,
            totalActiveLending: totalLentActive * currencyConfig.rate,
            monthlySnapshot: {
                income: monthlyMetrics.income * currencyConfig.rate,
                expense: monthlyMetrics.expense * currencyConfig.rate,
                savings: monthlyMetrics.savings * currencyConfig.rate
            }
        },
        data: {
            accounts: accounts.map(a => ({ name: a.name, type: a.type, balance: a.balance * currencyConfig.rate })),
            investments: investments.map(i => ({ name: i.name, type: i.type, amount: i.investedAmount * currencyConfig.rate, date: i.date })),
            debts: debts.map(d => ({ title: d.title, type: d.type, amount: d.amount * currencyConfig.rate, dueDate: d.dueDate })),
            goals: goals,
            activeLendings: lendings.filter(l => l.status === 'active').map(l => ({
                borrower: l.borrower,
                originalAmount: l.totalAmount * currencyConfig.rate,
                repaid: l.payments.reduce((s, p) => s + p.amount, 0) * currencyConfig.rate,
                returnDate: l.returnDate
            })),
            recentTransactions: transactions.slice(0, 30), 
            dateRange: { start: firstTxnDate, end: lastTxnDate }
        }
    };
}

// --- Audio Utils for Live API ---

export function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function createPcmBlob(data: Float32Array): { data: string, mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: bytesToBase64(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}