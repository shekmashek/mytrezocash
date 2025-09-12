export const getWeeksInMonth = (year, month) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    let mondays = 0;
    for (let day = 1; day <= lastDay; day++) {
      if (new Date(year, month, day).getDay() === 1) mondays++;
    }
    return mondays > 0 ? mondays : Math.ceil(lastDay / 7);
};

export const getEntryAmountForMonth = (entry, monthIndex, year) => {
    const targetMonthStart = new Date(year, monthIndex, 1);
    const targetMonthEnd = new Date(year, monthIndex + 1, 0);

    if (entry.frequency === 'ponctuel') {
      if (!entry.date) return 0;
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === year && entryDate.getMonth() === monthIndex ? entry.amount : 0;
    }

    if (entry.frequency === 'irregulier' || entry.frequency === 'provision') {
      if (!entry.payments || entry.payments.length === 0) return 0;
      return entry.payments.reduce((sum, payment) => {
        if (!payment.date || !payment.amount) return sum;
        const paymentDate = new Date(payment.date);
        if (paymentDate.getFullYear() === year && paymentDate.getMonth() === monthIndex) {
          return sum + parseFloat(payment.amount);
        }
        return sum;
      }, 0);
    }

    if (!entry.startDate) return 0;
    const startDate = new Date(entry.startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = entry.endDate ? new Date(entry.endDate) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    if (targetMonthEnd < startDate || (endDate && targetMonthStart > endDate)) return 0;

    switch (entry.frequency) {
      case 'journalier': {
        const start = targetMonthStart > startDate ? targetMonthStart : startDate;
        const end = endDate && targetMonthEnd > endDate ? endDate : targetMonthEnd;
        
        if (end < start) return 0;

        let count = 0;
        let currentDate = new Date(start);
        
        // If daysOfWeek is not specified or empty, count all days for backward compatibility.
        const daysToCount = entry.daysOfWeek && Array.isArray(entry.daysOfWeek) && entry.daysOfWeek.length > 0 
            ? entry.daysOfWeek 
            : [0, 1, 2, 3, 4, 5, 6];

        while(currentDate <= end) {
            if (daysToCount.includes(currentDate.getDay())) {
                count++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return entry.amount * count;
      }
      case 'mensuel': return entry.amount;
      case 'hebdomadaire': return entry.amount * getWeeksInMonth(year, monthIndex);
      case 'bimestriel': return (monthIndex - startDate.getMonth()) % 2 === 0 && monthIndex >= startDate.getMonth() ? entry.amount : 0;
      case 'trimestriel': return (monthIndex - startDate.getMonth()) % 3 === 0 && monthIndex >= startDate.getMonth() ? entry.amount : 0;
      case 'annuel': return monthIndex === startDate.getMonth() ? entry.amount : 0;
      default: return 0;
    }
};
