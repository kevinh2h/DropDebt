export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  preferredPaymentMethod: PaymentMethod;
  totalMonthlyIncome: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  // Additional profile-specific fields can be added here
  preferences?: UserPreferences;
  verificationStatus?: VerificationStatus;
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  autoPayEnabled: boolean;
  riskTolerance: 'low' | 'medium' | 'high';
  paymentSchedulePreference: 'weekly' | 'bi-weekly' | 'monthly';
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  pushNotifications: boolean;
  billReminders: boolean;
  paymentConfirmations: boolean;
}

export type PaymentMethod = 
  | 'bank_transfer' 
  | 'credit_card' 
  | 'debit_card' 
  | 'paypal' 
  | 'venmo';

export type VerificationStatus = 
  | 'pending' 
  | 'verified' 
  | 'rejected' 
  | 'expired';

// DynamoDB item structure for User
export interface UserDynamoItem {
  PK: string;        // USER#<userId>
  SK: string;        // PROFILE
  EntityType: string; // User
  GSI1PK: string;    // USER#<userId>
  GSI1SK: string;    // PROFILE
  UserId: string;
  Email: string;
  FirstName: string;
  LastName: string;
  Phone?: string;
  PreferredPaymentMethod: PaymentMethod;
  TotalMonthlyIncome: number;
  CreatedAt: string;
  UpdatedAt: string;
  // Optional fields
  Preferences?: string; // JSON stringified UserPreferences
  VerificationStatus?: VerificationStatus;
}