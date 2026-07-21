// Mock Database has been deactivated.
// Using server side endpoints directly.

export const getDb = () => {
  return {
    users: [],
    forms: [],
    questions: [],
    options: [],
    rules: [],
    results: [],
    answers: [],
    reviews: [],
    sessions: [],
    messages: []
  };
};

export const saveDb = (db) => {
  // Deactivated. No data is saved to local storage.
};

