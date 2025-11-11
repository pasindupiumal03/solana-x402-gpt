import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Constants
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC mint address on Solana mainnet
const RECIPIENT_ADDRESS = new PublicKey('6yK1zeAnkqAe1fBP5Kk773EUm8taJvAsSxnMcYCSzhSL'); // Valid recipient address
const RPC_ENDPOINT = 'https://rpc-mainnet.solanatracker.io/?api_key=8b90bec5-e575-4212-9c39-4e2496f29a2f';
const PAYMENT_AMOUNT = 0.00001; // 0.00001 USDC per chat

export interface PaymentRequest {
  userPublicKey: PublicKey;
  amount: number;
  memo?: string;
}

export interface PaymentResult {
  success: boolean;
  transaction?: Transaction;
  signature?: string;
  error?: string;
}

export class USDCPaymentService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(RPC_ENDPOINT, 'confirmed');
  }

  // Create a USDC transfer transaction
  async createPaymentTransaction({
    userPublicKey,
    amount = PAYMENT_AMOUNT,
    memo = 'X402 Chat Payment'
  }: PaymentRequest): Promise<PaymentResult> {
    try {
      console.log('Creating payment transaction for:', userPublicKey.toBase58());
      console.log('Amount:', amount, 'USDC');
      console.log('Recipient:', RECIPIENT_ADDRESS.toBase58());

      // Get user's USDC token account
      const userUSDCAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        userPublicKey
      );

      // Get recipient's USDC token account
      const recipientUSDCAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        RECIPIENT_ADDRESS
      );

      console.log('User USDC account:', userUSDCAccount.toBase58());
      console.log('Recipient USDC account:', recipientUSDCAccount.toBase58());

      // Check if accounts exist
      const userAccountInfo = await this.connection.getAccountInfo(userUSDCAccount);
      if (!userAccountInfo) {
        return {
          success: false,
          error: 'User does not have a USDC token account. Please ensure you have USDC tokens.'
        };
      }

      const recipientAccountInfo = await this.connection.getAccountInfo(recipientUSDCAccount);
      if (!recipientAccountInfo) {
        console.log('Recipient USDC token account does not exist, but continuing...');
        // Note: In production, you might want to create the recipient account
        // For now, we'll continue and let the transaction fail if needed
      }

      // Convert amount to smallest unit (USDC has 6 decimals)
      const transferAmount = Math.floor(amount * 1_000_000);
      console.log('Transfer amount (in smallest units):', transferAmount);

      // Create transaction
      const transaction = new Transaction();

      // Add memo instruction if provided
      if (memo) {
        const memoInstruction = new TransactionInstruction({
          keys: [],
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
          data: Buffer.from(memo, 'utf8'),
        });
        transaction.add(memoInstruction);
      }

      // Add transfer instruction
      const transferInstruction = createTransferInstruction(
        userUSDCAccount,
        recipientUSDCAccount,
        userPublicKey,
        transferAmount,
        [],
        TOKEN_PROGRAM_ID
      );

      transaction.add(transferInstruction);

      // Get latest blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublicKey;

      console.log('Transaction created successfully');

      return {
        success: true,
        transaction
      };
    } catch (error) {
      console.error('Error creating payment transaction:', error);
      return {
        success: false,
        error: `Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Verify a payment transaction
  async verifyPayment(signature: string): Promise<boolean> {
    try {
      console.log('Verifying payment signature:', signature);
      
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });

      if (!transaction || transaction.meta?.err) {
        console.log('Transaction not found or failed:', transaction?.meta?.err);
        return false;
      }

      console.log('Transaction found, verification complete');
      
      // For now, just check if transaction exists and succeeded
      // In production, you would verify:
      // - Transfer amount matches expected amount
      // - Transfer recipient matches expected recipient
      // - Transfer token mint matches USDC
      return true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  // Get user's USDC balance
  async getUserUSDCBalance(userPublicKey: PublicKey): Promise<number> {
    try {
      console.log('Checking USDC balance for:', userPublicKey.toBase58());
      
      const userUSDCAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        userPublicKey
      );

      console.log('Expected USDC token account:', userUSDCAccount.toBase58());

      // Check if the token account exists
      const accountInfo = await this.connection.getAccountInfo(userUSDCAccount);
      if (!accountInfo) {
        console.log('USDC token account not found for user. User may need to create one first.');
        
        // Check if user has any token accounts at all
        const tokenAccounts = await this.connection.getTokenAccountsByOwner(userPublicKey, {
          programId: TOKEN_PROGRAM_ID,
        });
        
        console.log(`User has ${tokenAccounts.value.length} token accounts`);
        
        if (tokenAccounts.value.length > 0) {
          console.log('Available token accounts:');
          for (const account of tokenAccounts.value) {
            try {
              const balance = await this.connection.getTokenAccountBalance(account.pubkey);
              console.log(`Account: ${account.pubkey.toBase58()}, Balance: ${balance.value.uiAmount} ${balance.value.uiAmountString}`);
            } catch (error) {
              console.log(`Account: ${account.pubkey.toBase58()}, Error getting balance:`, error);
            }
          }
        }
        
        return 0;
      }

      const balance = await this.connection.getTokenAccountBalance(userUSDCAccount);
      const uiAmount = balance.value.uiAmount;
      
      console.log('USDC balance result:', balance.value);
      
      if (uiAmount === null || uiAmount === undefined) {
        return 0;
      }
      
      return parseFloat(uiAmount.toString());
    } catch (error) {
      console.error('Error getting USDC balance:', error);
      return 0;
    }
  }

  // Check if user has enough USDC for payment
  async checkSufficientFunds(userPublicKey: PublicKey, amount: number = PAYMENT_AMOUNT): Promise<boolean> {
    const balance = await this.getUserUSDCBalance(userPublicKey);
    return balance >= amount;
  }

  // Helper function to get all user's token accounts for debugging
  async getAllUserTokenAccounts(userPublicKey: PublicKey): Promise<any[]> {
    try {
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(userPublicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const accounts = [];
      for (const account of tokenAccounts.value) {
        try {
          const balance = await this.connection.getTokenAccountBalance(account.pubkey);
          const accountInfo = await this.connection.getParsedAccountInfo(account.pubkey);
          const parsedData = accountInfo.value?.data;
          
          accounts.push({
            address: account.pubkey.toBase58(),
            balance: balance.value,
            mint: (parsedData && typeof parsedData === 'object' && 'parsed' in parsedData) 
              ? parsedData.parsed?.info?.mint || 'Unknown'
              : 'Unknown',
          });
        } catch (error) {
          console.log(`Error getting account info for ${account.pubkey.toBase58()}:`, error);
        }
      }
      
      return accounts;
    } catch (error) {
      console.error('Error getting token accounts:', error);
      return [];
    }
  }
}

export const paymentService = new USDCPaymentService();
export { PAYMENT_AMOUNT, RECIPIENT_ADDRESS };