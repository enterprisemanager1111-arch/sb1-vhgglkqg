import { useLanguage } from '@/contexts/LanguageContext';

export const useLocalizedDate = () => {
  const { currentLanguage, t } = useLanguage();

  const getMonthNames = () => {
    return [
      t('calendar.months.january') || 'January',
      t('calendar.months.february') || 'February',
      t('calendar.months.march') || 'March',
      t('calendar.months.april') || 'April',
      t('calendar.months.may') || 'May',
      t('calendar.months.june') || 'June',
      t('calendar.months.july') || 'July',
      t('calendar.months.august') || 'August',
      t('calendar.months.september') || 'September',
      t('calendar.months.october') || 'October',
      t('calendar.months.november') || 'November',
      t('calendar.months.december') || 'December',
    ];
  };

  const getMonthNamesShort = () => {
    return [
      t('calendar.monthsShort.january') || 'Jan',
      t('calendar.monthsShort.february') || 'Feb',
      t('calendar.monthsShort.march') || 'Mar',
      t('calendar.monthsShort.april') || 'Apr',
      t('calendar.monthsShort.may') || 'May',
      t('calendar.monthsShort.june') || 'Jun',
      t('calendar.monthsShort.july') || 'Jul',
      t('calendar.monthsShort.august') || 'Aug',
      t('calendar.monthsShort.september') || 'Sep',
      t('calendar.monthsShort.october') || 'Oct',
      t('calendar.monthsShort.november') || 'Nov',
      t('calendar.monthsShort.december') || 'Dec',
    ];
  };

  const getDayNames = () => {
    return [
      t('calendar.days.sunday') || 'Sunday',
      t('calendar.days.monday') || 'Monday',
      t('calendar.days.tuesday') || 'Tuesday',
      t('calendar.days.wednesday') || 'Wednesday',
      t('calendar.days.thursday') || 'Thursday',
      t('calendar.days.friday') || 'Friday',
      t('calendar.days.saturday') || 'Saturday',
    ];
  };

  const formatDate = (date: Date, format: 'full' | 'short' | 'month' = 'full') => {
    const monthNames = format === 'short' ? getMonthNamesShort() : getMonthNames();
    
    switch (format) {
      case 'full':
        return `${date.getDate()}. ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      case 'short':
        return `${date.getDate()}. ${monthNames[date.getMonth()]}`;
      case 'month':
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      default:
        return date.toLocaleDateString(currentLanguage.code === 'en' ? 'en-US' : currentLanguage.code);
    }
  };

  const getLocale = () => {
    switch (currentLanguage.code) {
      case 'de': return 'de-DE';
      case 'en': return 'en-US';
      case 'fr': return 'fr-FR';
      case 'es': return 'es-ES';
      case 'it': return 'it-IT';
      default: return 'en-US';
    }
  };

  return {
    getMonthNames,
    getMonthNamesShort,
    getDayNames,
    formatDate,
    getLocale,
  };
};
