import { useLanguage } from '@/contexts/LanguageContext';

export const useLocalizedDate = () => {
  const { currentLanguage, t } = useLanguage();

  const getMonthNames = () => {
    return [
      t('calendar.months.january'),
      t('calendar.months.february'),
      t('calendar.months.march'),
      t('calendar.months.april'),
      t('calendar.months.may'),
      t('calendar.months.june'),
      t('calendar.months.july'),
      t('calendar.months.august'),
      t('calendar.months.september'),
      t('calendar.months.october'),
      t('calendar.months.november'),
      t('calendar.months.december'),
    ];
  };

  const getMonthNamesShort = () => {
    return [
      t('calendar.monthsShort.january'),
      t('calendar.monthsShort.february'),
      t('calendar.monthsShort.march'),
      t('calendar.monthsShort.april'),
      t('calendar.monthsShort.may'),
      t('calendar.monthsShort.june'),
      t('calendar.monthsShort.july'),
      t('calendar.monthsShort.august'),
      t('calendar.monthsShort.september'),
      t('calendar.monthsShort.october'),
      t('calendar.monthsShort.november'),
      t('calendar.monthsShort.december'),
    ];
  };

  const getDayNames = () => {
    return [
      t('calendar.days.sunday'),
      t('calendar.days.monday'),
      t('calendar.days.tuesday'),
      t('calendar.days.wednesday'),
      t('calendar.days.thursday'),
      t('calendar.days.friday'),
      t('calendar.days.saturday'),
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
