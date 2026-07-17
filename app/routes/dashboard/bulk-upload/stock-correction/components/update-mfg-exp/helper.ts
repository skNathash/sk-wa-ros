export const mfgDateConfig = {
  disabled: { after: new Date() },
  startMonth: new Date(new Date().getFullYear() - 5, 0),
  endMonth: new Date(),
};

export const expiryDateConfig = {
  disabled: { before: new Date() },
  startMonth: new Date(),
  endMonth: new Date(new Date().getFullYear() + 5, 11),
};
