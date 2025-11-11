'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@crypto-wallet-tracker/config';
import { Transaction } from '@crypto-wallet-tracker/types';

const summarizeAddress = (addr: string, leading = 8, trailing = 6) =>
  `${addr.slice(0, leading)}...${addr.slice(-trailing)}`;
const formatDisplayDate = (date: Date | string) => new Date(date).toLocaleString();
const formatQuantitativeValue = (value: bigint | string | null) => {
  if (!value && value !== 0) {
    return 'N/A';
  }

  if (typeof value === 'string') {
    return value;
  }

  return value.toString();
};

export default function TransactionDetailScreen() {
  const params = useParams();
  const router = useRouter();
  const hash = params.hash as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const retrieveTransactionDetails = useCallback(async () => {
    if (!hash) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/transaction/${hash}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Transaction not found');
        }
        throw new Error('Failed to fetch transaction');
      }

      const data = await response.json();
      setTransaction(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transaction');
    } finally {
      setLoading(false);
    }
  }, [hash]);

  useEffect(() => {
    retrieveTransactionDetails();
  }, [retrieveTransactionDetails]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 px-10 py-12 shadow-[0_30px_80px_rgba(15,23,42,0.6)]">
          <span className="h-3 w-3 animate-ping rounded-full bg-blue-400" />
          <p className="text-sm">Loading transaction details...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
        <div className="max-w-md rounded-3xl border border-rose-500/40 bg-rose-500/10 p-10 text-center shadow-[0_30px_90px_rgba(190,18,60,0.35)]">
          <h2 className="text-2xl font-semibold text-rose-100">Something went wrong.</h2>
          <p className="mt-3 text-sm text-rose-100/80">{error}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              Go Back
            </button>
            <button
              onClick={retrieveTransactionDetails}
              className="inline-flex items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/20 px-5 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/30"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!transaction) {
    return null;
  }

  const statusIsSuccess = transaction.status === 'success';
  const statusStyles = statusIsSuccess
    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
    : 'border border-rose-500/30 bg-rose-500/10 text-rose-200';
  const overviewMetrics = [
    { label: 'Block Number', value: formatQuantitativeValue(transaction.blockNumber) },
    { label: 'Timestamp', value: formatDisplayDate(transaction.timestamp) },
    { label: 'Gas Used', value: formatQuantitativeValue(transaction.gasUsed) },
    { label: 'Gas Price', value: `${formatQuantitativeValue(transaction.gasPrice)} Wei` },
  ];
  const addressEntries = [
    { label: 'From', value: transaction.fromAddress },
    { label: 'To', value: transaction.toAddress },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-10%] h-72 w-72 rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-purple-500/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-12 lg:px-10 lg:py-16">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
              Transaction Detail
            </span>
            <h1 className="text-3xl font-semibold text-slate-100 sm:text-4xl">
              Examination Summary
            </h1>
            <p className="text-xs font-mono text-blue-200">
              {summarizeAddress(transaction.hash, 12, 10)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              Back
            </button>
            <a
              href={`https://sepolia.etherscan.io/tx/${transaction.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/20 px-5 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/30"
            >
              View on Etherscan
            </a>
          </div>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.55)]">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
              <span
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${statusStyles}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${statusIsSuccess ? 'bg-emerald-400' : 'bg-rose-400'}`}
                />
                {transaction.status.toUpperCase()}
              </span>
            </div>

            <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-6 shadow-[0_30px_100px_rgba(37,99,235,0.25)]">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-200">Transfer Amount</p>
              <p className="mt-4 text-3xl font-semibold text-blue-100">
                {parseFloat(transaction.amount).toFixed(6)} ETH
              </p>
              <p className="mt-2 text-xs text-blue-100/70">
                Pulled directly from on-chain transaction value.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.55)]">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Overview</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {overviewMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-100">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.55)]">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Transaction Hash
                </p>
                <p className="mt-3 break-all font-mono text-sm text-blue-200">{transaction.hash}</p>
              </div>

              {addressEntries.map((entry) => (
                <div key={entry.label}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{entry.label}</p>
                  <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <p className="break-all font-mono text-sm text-slate-200">{entry.value}</p>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quick Summary</p>
                <p className="mt-3 text-sm text-slate-300">
                  Transfer initiated by{' '}
                  <span className="font-mono text-xs text-blue-200">
                    {summarizeAddress(transaction.fromAddress)}
                  </span>{' '}
                  and routed to{' '}
                  <span className="font-mono text-xs text-blue-200">
                    {summarizeAddress(transaction.toAddress)}
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
