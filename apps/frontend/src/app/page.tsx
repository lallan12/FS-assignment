'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, CHAIN_ID } from '@crypto-wallet-tracker/config';

export default function LandingScreen() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    verifyExistingWalletSession();
    registerWalletEventHandlers();
  }, []);

  const verifyExistingWalletSession = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          await processAccountSelection(accounts[0].address);
        }
      } catch (err) {
        console.error('Error checking connection:', err);
      }
    }
  };

  const registerWalletEventHandlers = () => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          processAccountSelection(accounts[0]);
        } else {
          setAccount(null);
          setBalance(null);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  };

  const processAccountSelection = async (address: string) => {
    setAccount(address);
    setLoading(true);
    setError(null);

    try {
      // Check network
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== CHAIN_ID) {
        setError(
          `Please switch to the correct network (Chain ID: ${CHAIN_ID}). Current: ${network.chainId}`
        );
        setLoading(false);
        return;
      }

      // Fetch balance from backend
      const response = await fetch(`${API_BASE_URL}/wallet/${address}/balance`);
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      const data = await response.json();
      setBalance(data.balance);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wallet balance');
    } finally {
      setLoading(false);
    }
  };

  const requestWalletConnection = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);

      if (accounts.length > 0) {
        await processAccountSelection(accounts[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      setLoading(false);
    }
  };

  const navigateToTransactions = () => {
    if (account) {
      router.push(`/transactions?address=${account}`);
    }
  };

  const condenseAddressValue = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`;
  const isConnected = Boolean(account);
  const condensedAccount = account ? condenseAddressValue(account) : '';
  const formattedBalance = balance ? `${parseFloat(balance).toFixed(4)} ETH` : 'N/A';
  const featureHighlights = [
    {
      title: 'Transparent Ledger',
      description: 'Monitor outgoing and incoming transactions with real-time confirmation states.',
    },
    {
      title: 'Precision Balances',
      description:
        'Fetch accurate on-chain balances through a dedicated Sepolia provider endpoint.',
    },
    {
      title: 'Effortless Sync',
      description: 'Refresh historical activity on demand and keep storage aligned with the chain.',
    },
    {
      title: 'Actionable Insights',
      description:
        'Dive into every transaction to explore gas usage, receipts, and explorer links.',
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-[-10%] h-72 w-72 rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-12 lg:px-10 lg:py-16">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
              Live on Sepolia
            </span>
            <h1 className="text-3xl font-semibold text-slate-100 sm:text-4xl">
              Crypto Wallet Tracker
            </h1>
            <p className="max-w-xl text-sm text-slate-400">
              A polished dashboard to surface wallet balances, categorize transfers, and drill into
              every on-chain transaction in seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Runtime Ready
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 font-medium">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Chain ID {CHAIN_ID}
            </span>
          </div>
        </header>

        <div className="mt-12 grid flex-1 items-start gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className="space-y-10">
            <div className="space-y-5">
              <h2 className="text-4xl font-semibold leading-tight text-slate-100 sm:text-5xl">
                Command your wallet with clarity and confidence
              </h2>
              <p className="max-w-2xl text-lg text-slate-300">
                Connect your Ethereum wallet to surface balances, inspect every transfer, and gain
                structured insights into your decentralized activity.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Network Target</p>
                <p className="mt-4 text-3xl font-semibold text-blue-300">Ethereum Sepolia</p>
                <p className="mt-2 text-sm text-slate-400">Connecting through a dedicated RPC.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Wallet Status</p>
                <p
                  className={`mt-4 text-3xl font-semibold ${
                    isConnected ? 'text-emerald-300' : 'text-slate-500'
                  }`}
                >
                  {isConnected ? 'Connected' : 'Waiting'}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {isConnected && condensedAccount
                    ? condensedAccount
                    : 'Authorize access to begin tracking.'}
                </p>
              </div>
            </div>

            <ul className="grid gap-4 md:grid-cols-2">
              {featureHighlights.map((feature) => (
                <li
                  key={feature.title}
                  className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition-colors hover:border-blue-500/40"
                >
                  <p className="text-base font-semibold text-slate-100">{feature.title}</p>
                  <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.55)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-100">Wallet Console</p>
                <p className="mt-1 text-sm text-slate-400">
                  Securely connect to visualize balances and transactions.
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                  isConnected
                    ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border border-slate-700 bg-slate-900/80 text-slate-400'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
                {isConnected ? 'Linked' : 'Disconnected'}
              </span>
            </div>

            <div className="mt-8 space-y-6">
              {isConnected ? (
                <>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Primary Account
                    </p>
                    <p className="mt-3 font-mono text-sm text-blue-200 break-all">{account}</p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
                      {condensedAccount} - Web3
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Balance</p>
                      <p className="mt-3 text-3xl font-semibold text-emerald-100">
                        {loading ? 'Loading...' : formattedBalance}
                      </p>
                      <p className="mt-2 text-xs text-emerald-100/70">
                        Retrieved securely via the backend balance endpoint.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Quick Actions
                      </p>
                      <ul className="mt-3 space-y-3 text-sm text-slate-300">
                        <li className="flex items-center gap-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-blue-400" />
                          Discover categorized transaction histories instantly.
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-blue-400" />
                          Inspect gas usage, receipts, and explorer links.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={navigateToTransactions}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-400"
                    >
                      View Transactions
                    </button>
                    <button
                      onClick={() => {
                        setAccount(null);
                        setBalance(null);
                      }}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                    >
                      Disconnect
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-300">
                    <p>
                      Authenticate with MetaMask to surface your Sepolia balances and build a living
                      ledger of your activity.
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      We only request read permissions to identify your wallet address.
                    </p>
                  </div>
                  <button
                    onClick={requestWalletConnection}
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 animate-ping rounded-full bg-slate-900" />
                        Connecting...
                      </span>
                    ) : (
                      <>
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        Connect Wallet
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {error && (
        <div className="pointer-events-auto fixed bottom-6 right-6 max-w-sm rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5 shadow-lg backdrop-blur">
          <p className="text-sm font-medium text-rose-200">Connection error</p>
          <p className="mt-1 text-sm text-rose-100/80">{error}</p>
        </div>
      )}
    </main>
  );
}
