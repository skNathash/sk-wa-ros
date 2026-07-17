// Sample data for Replies
const sampleReplies = [
  {
    id: "1",
    profileImg: "https://randomuser.me/api/portraits/men/32.jpg",
    email: "john.doe@example.com",
    description: "This is a sample reply from John.",
    date: "2025-07-19T14:30:00Z",
  },
  {
    id: "2",
    profileImg: "https://randomuser.me/api/portraits/women/44.jpg",
    email: "jane.smith@example.com",
    description: "Jane's response to the ticket.",
    date: "2025-07-20T09:15:00Z",
  },
  {
    id: "3",
    profileImg: "https://randomuser.me/api/portraits/men/55.jpg",
    email: "bob.brown@example.com",
    description: "Bob followed up on the issue.",
    date: "2025-07-20T11:45:00Z",
  },
];

export const getData = (params?: any): Promise<typeof sampleReplies> => {
  // In real usage, fetch from API
  return Promise.resolve(sampleReplies);
};

export const getCount = (params?: any): Promise<number> => {
  // In real usage, fetch count from API
  return Promise.resolve(sampleReplies.length);
};

export const prepareParams = (filter: any, pagination: any, sort: any) => {
  // Prepare params for API call if needed
  return {};
};
