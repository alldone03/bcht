export function calculateAge(dob) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export function formatDateWithAge(dob) {
  if (!dob) return '-';
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return dob;
  const formattedDate = birthDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const age = calculateAge(dob);
  return age !== null ? `${formattedDate} (${age} thn)` : formattedDate;
}
