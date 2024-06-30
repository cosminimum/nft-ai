interface UserDataInterface {
  totalAmount: number;
  transactionCount: number;
  categories: {
    [category: string]: {
      totalAmount: number;
      transactionCount: number;
    };
  };
  timeOfDay: {
    [hour: number]: number;
  };
}