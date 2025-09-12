export const getWeeksInMonth = (year, month) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    let mondays = 0;
    for (let day = 1; day <= lastDay; day++) {
      if (new Date(year, month, day).getDay() === 1) mondays++;
    }
    return mondays > 0 ? mondays : Math.ceil(lastDay / 7);
};

export const getEntryAmountForMonth = (entry, monthIndex, year) => {
    const periodStart = new Date(year, monthIndex, 1);
    const periodEnd = new Date(year, monthIndex + 1, 1);
    return getEntryAmountForPeriod(entry, periodStart, periodEnd);
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
    let current = new Date(entryStartDate);

    switch (entry.frequency) {
        case 'journalier': {
            const daysToCount = entry.daysOfWeek && Array.isArray(entry.daysOfWeek) && entry.daysOfWeek.length > 0 ? entry.daysOfWeek : [0, 1, 2, 3, 4, 5, 6];
            while (current < calcEnd) {
                if (current >= calcStart && daysToCount.includes(current.getDay())) {
                    total += entry.amount;
                }
                current.setDate(current.getDate() + 1);
            }
            return total;
        }
        case 'hebdomadaire': {
            while (current < calcEnd) {
                if (current >= calcStart) {
                    total += entry.amount;
                }
                current.setDate(current.getDate() + 7);
            }
            return total;
        }
        case 'mensuel': {
            while(current < calcEnd) {
                if (current >= calcStart) {
                    total += entry.amount;
                }
                current.setMonth(current.getMonth() + 1);
            }
            return total;
        }
        case 'bimestriel': {
            while(current < calcEnd) {
                if (current >= calcStart) {
                    total += entry.amount;
                }
                current.setMonth(current.getMonth() + 2);
            }
            return total;
        }
        case 'trimestriel': {
            while(current < calcEnd) {
                if (current >= calcStart) {
                    total += entry.amount;
                }
                current.setMonth(current.getMonth() + 3);
            }
            return total;
        }
        case 'semestriel': {
            while(current < calcEnd) {
                if (current >= calcStart) {
                    total += entry.amount;
                }
                current.setMonth(current.getMonth() + 6);
            }
            return total;
        }
        case 'annuel': {
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
