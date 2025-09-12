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

export const getEntryAmountForPeriod = (entry, periodStart, periodEnd) => {
    if (!entry || !entry.frequency || !entry.amount) return 0;

    const entryStartDate = entry.startDate ? new Date(entry.startDate) : null;
    const entryEndDate = entry.endDate ? new Date(entry.endDate) : null;
    if(entryEndDate) entryEndDate.setHours(23, 59, 59, 999);

    const calcStart = entryStartDate && entryStartDate > periodStart ? entryStartDate : periodStart;
    let calcEnd = entryEndDate && entryEndDate < periodEnd ? entryEndDate : periodEnd;
    
    if (calcEnd < calcStart) return 0;

    if (entry.frequency === 'ponctuel') {
        if (!entry.date) return 0;
        const entryDate = new Date(entry.date);
        return (entryDate >= periodStart && entryDate < periodEnd) ? entry.amount : 0;
    }

    if (entry.frequency === 'irregulier' || entry.frequency === 'provision') {
        if (!entry.payments) return 0;
        return entry.payments.reduce((sum, payment) => {
            if (!payment.date || !payment.amount) return sum;
            const paymentDate = new Date(payment.date);
            if (paymentDate >= periodStart && paymentDate < periodEnd) {
                return sum + parseFloat(payment.amount);
            }
            return sum;
        }, 0);
    }
    
    if (!entryStartDate) return 0;
    if (periodEnd < entryStartDate || (entryEndDate && periodStart > entryEndDate)) return 0;

    let total = 0;
    switch (entry.frequency) {
        case 'journalier': {
            let current = new Date(calcStart);
            const daysToCount = entry.daysOfWeek && Array.isArray(entry.daysOfWeek) && entry.daysOfWeek.length > 0 ? entry.daysOfWeek : [0, 1, 2, 3, 4, 5, 6];
            while (current < calcEnd) {
                if (daysToCount.includes(current.getDay())) {
                    total += entry.amount;
                }
                current.setDate(current.getDate() + 1);
            }
            return total;
        }
        case 'hebdomadaire': {
            let current = new Date(entryStartDate);
            while (current < calcStart) {
                current.setDate(current.getDate() + 7);
            }
            while (current < calcEnd) {
                total += entry.amount;
                current.setDate(current.getDate() + 7);
            }
            return total;
        }
        case 'mensuel': {
            let current = new Date(entryStartDate.getFullYear(), entryStartDate.getMonth(), entryStartDate.getDate());
            while(current < calcEnd) {
                if (current >= calcStart) {
                    total += entry.amount;
                }
                current.setMonth(current.getMonth() + 1);
            }
            return total;
        }
        case 'bimestriel': {
            let current = new Date(entryStartDate.getFullYear(), entryStartDate.getMonth(), entryStartDate.getDate());
            while(current < calcEnd) {
                if (current >= calcStart) {
                    total += entry.amount;
                }
                current.setMonth(current.getMonth() + 2);
            }
            return total;
        }
        case 'trimestriel': {
            let current = new Date(entryStartDate.getFullYear(), entryStartDate.getMonth(), entryStartDate.getDate());
            while(current < calcEnd) {
                if (current >= calcStart) {
                    total += entry.amount;
                }
                current.setMonth(current.getMonth() + 3);
            }
            return total;
        }
        case 'annuel': {
            let current = new Date(entryStartDate.getFullYear(), entryStartDate.getMonth(), entryStartDate.getDate());
            while(current < calcEnd) {
                if (current >= calcStart) {
                    total += entry.amount;
                }
                current.setFullYear(current.getFullYear() + 1);
            }
            return total;
        }
        default: return 0;
    }
};
