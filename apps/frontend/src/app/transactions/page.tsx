'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@crypto-wallet-tracker/config';
import { Transaction, TransactionType } from '@crypto-wallet-tracker/types';

const summarizeAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
const formatDisplayDate = (date: Date | string) => new Date(date).toLocaleString();
const deriveTransactionDirection = (wallet: string, tx: Transaction) =>
  tx.fromAddress.toLowerCase() === wallet.toLowerCase() ? 'sent' : 'received';

export default function TransactionListScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const address = searchParams.get('address') || '';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TransactionType>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const filterOptions = useMemo(
    () => [
      { value: 'all', label: 'All' },
      { value: 'sent', label: 'Sent' },
      { value: 'received', label: 'Received' },
    ],
    []
  );

  const condensedWalletAddress = useMemo(
    () => (address ? summarizeAddress(address) : ''),
    [address]
  );

  const summaryStats = useMemo(
    () => [
      { label: 'Total Transactions', value: total },
      { label: 'Showing Now', value: transactions.length },
      { label: 'Active Filter', value: filter.toUpperCase() },
    ],
    [filter, total, transactions.length]
  );

  const retrieveTransactions = useCallback(async () => {
    if (!address) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const typeParam = filter !== 'all' ? `&type=${filter}` : '';
      const response = await fetch(
        `${API_BASE_URL}/wallet/${address}/transactions?page=${page}&limit=20${typeParam}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();

      if (page === 1) {
        setTransactions(data.transactions);
        setHasMore(data.transactions.length === 20 && data.transactions.length < data.total);
      } else {
        setTransactions((prev) => {
          const next = [...prev, ...data.transactions];
          setHasMore(data.transactions.length === 20 && next.length < data.total);
          return next;
        });
      }

      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [address, filter, page]);

  const triggerTransactionSync = useCallback(async () => {
    if (!address) {
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/transactions/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          limit: 20,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync transactions');
      }

      const data = await response.json();
      setPage(1);
      await retrieveTransactions();
      alert(`Synced ${data.synced} transactions (${data.new} new)`);
    } catch (err: any) {
      setError(err.message || 'Failed to sync transactions');
    } finally {
      setSyncing(false);
    }
  }, [address, retrieveTransactions]);

  useEffect(() => {
    if (address) {
      if (page === 1) {
        setTransactions([]);
      }
      retrieveTransactions();
    } else {
      setError('No wallet address provided');
      setLoading(false);
    }
  }, [address, page, retrieveTransactions]);

  useEffect(() => {
    setPage(1);
    setTransactions([]);
  }, [filter]);

  const syncButtonLabel = syncing ? 'Syncing...' : 'Sync Transactions';
  const hasTransactions = transactions.length > 0;

  if (!address) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
        <div className="max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 p-10 text-center shadow-[0_30px_80px_rgba(15,23,42,0.6)]">
          <p className="text-lg font-semibold text-rose-200">No wallet address detected.</p>
          <p className="mt-3 text-sm text-slate-400">
            Head back to the dashboard and connect a wallet to inspect its transaction history.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-blue-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-blue-400"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-10%] h-72 w-72 rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-purple-500/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-12 lg:px-10 lg:py-16">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
              Wallet Overview
            </span>
            <h1 className="text-3xl font-semibold text-slate-100 sm:text-4xl">
              Transaction Activity
            </h1>
            <p className="max-w-xl text-sm text-slate-400">
              Detailed Sepolia ledger for{' '}
              <span className="font-mono text-xs text-blue-200">{address}</span>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              Back to Dashboard
            </button>
            <button
              onClick={triggerTransactionSync}
              disabled={syncing}
              className="inline-flex items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/20 px-5 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncButtonLabel}
            </button>
          </div>
        </header>

        <section className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.55)]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Wallet Address</p>
              <p className="break-all font-mono text-sm text-blue-200">{address}</p>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
                {condensedWalletAddress}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {summaryStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-center"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                  <p className="mt-3 text-xl font-semibold text-slate-100">
                    {typeof stat.value === 'number'
                      ? stat.value.toLocaleString()
                      : String(stat.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {filterOptions.map((option) => {
              const isActive = filter === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setFilter(option.value);
                    setPage(1);
                  }}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    isActive
                      ? 'border-blue-500 bg-blue-500/20 text-blue-100'
                      : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-blue-500/40 hover:text-blue-100'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.55)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-100">Transfer History</h2>
            <span className="text-xs text-slate-500">
              Updated view of your on-chain transactions.
            </span>
          </div>

          {loading && transactions.length === 0 ? (
            <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-12 text-slate-400">
              <span className="h-3 w-3 animate-pulse rounded-full bg-blue-400" />
              <p>Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="mt-10 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-10 text-center">
              <p className="text-sm text-rose-100">{error}</p>
              <button
                onClick={retrieveTransactions}
                className="mt-4 inline-flex items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/20 px-5 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/30"
              >
                Retry Fetch
              </button>
            </div>
          ) : !hasTransactions ? (
            <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-950/60 p-12 text-center text-slate-400">
              No transactions found for this filter.
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {transactions.map((tx) => {
                const direction = deriveTransactionDirection(address, tx);
                const counterpart =
                  direction === 'sent' ? (tx.toAddress ?? '') : (tx.fromAddress ?? '');
                const counterpartDisplay = counterpart ? summarizeAddress(counterpart) : 'N/A';
                const formattedAmount = `${direction === 'sent' ? '-' : '+'}${parseFloat(
                  tx.amount
                ).toFixed(4)} ETH`;
                const directionStyles =
                  direction === 'sent'
                    ? 'border border-rose-500/30 bg-rose-500/10 text-rose-200'
                    : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
                const amountTone = direction === 'sent' ? 'text-rose-300' : 'text-emerald-300';
                const statusStyles =
                  tx.status === 'success'
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border border-rose-500/30 bg-rose-500/10 text-rose-200';

                return (
                  <button
                    type="button"
                    key={tx.id}
                    onClick={() => router.push(`/transaction/${tx.hash}`)}
                    className="group w-full rounded-2xl border border-slate-800 bg-slate-950/50 p-5 text-left transition hover:border-blue-500/40 hover:bg-slate-900/60"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${directionStyles}`}
                          >
                            {direction.toUpperCase()}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles}`}
                          >
                            {tx.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDisplayDate(tx.timestamp)}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-slate-400">
                          {summarizeAddress(tx.hash)}
                        </p>
                        <p className="text-sm text-slate-300">
                          {direction === 'sent' ? 'To' : 'From'}{' '}
                          <span className="font-mono text-xs text-blue-200">
                            {counterpartDisplay}
                          </span>
                        </p>
                      </div>
                      <div className={`text-lg font-semibold ${amountTone}`}>{formattedAmount}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setPage(page + 1)}
                disabled={loading}
                className="rounded-full border border-blue-500/30 bg-blue-500/10 px-6 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-slate-500">
            Showing {transactions.length} of {total.toLocaleString()} transactions
          </div>
        </section>
      </div>
    </main>
  );
}
