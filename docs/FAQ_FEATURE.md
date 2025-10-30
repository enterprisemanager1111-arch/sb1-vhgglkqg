# FAQ & Help Feature Implementation

## Overview
The FAQ & Help feature provides users with quick access to common questions and answers directly within the profile page. It includes an expandable/collapsible interface for easy navigation and a direct link to contact support.

## Features

### 📚 **9 Common FAQs Covered:**
1. 🚀 **Getting Started** - How to begin using Famora
2. 👨‍👩‍👧‍👦 **Add Family Members** - Inviting and managing family
3. ✅ **Manage Tasks** - Understanding the task system
4. 🔥 **Flames & Points** - Reward system explanation
5. 🔔 **Notifications** - Managing push notifications
6. 🔐 **Change Password** - Password security
7. 🌙 **Dark Mode** - Theme customization
8. ⚠️ **Delete Account** - Account management
9. 💬 **Contact Support** - Getting additional help

### 🎯 Key Features
1. **Expandable/Collapsible UI** - Tap questions to reveal answers
2. **Icon-based Navigation** - Each FAQ has a relevant emoji icon
3. **Active State Highlighting** - Expanded questions turn green
4. **Scrollable Content** - Handles many FAQs gracefully
5. **Contact Support CTA** - Direct link to support at the bottom
6. **Dark Mode Support** - Fully styled for light and dark themes
7. **Internationalization** - Full i18n support (currently English only)

## User Flow

1. User navigates to Profile → Communication → "FAQ & Help"
2. FAQ modal opens with list of common questions
3. User taps a question to expand and see the answer
4. User can tap again to collapse
5. If still need help, user clicks "Contact Support" button
6. User closes modal when done

## Technical Implementation

### State Management
```typescript
const [showFaqModal, setShowFaqModal] = useState(false);
const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
```

### FAQ Data Structure
```typescript
const faqItems = [
  {
    id: 'getting-started',
    question: 'How do I get started with Famora?',
    answer: 'Create a family, invite members...',
    icon: '🚀'
  },
  // ... more items
];
```

### Toggle Function
```typescript
const toggleFaqItem = (id: string) => {
  setExpandedFaqId(expandedFaqId === id ? null : id);
};
```

## UI Components

### FAQ Modal Structure
- **Header**: Title + Subtitle
- **Scrollable List**: FAQ items
- **Footer**: "Still need help?" + Contact Support button
- **Close Button**: Dismiss modal

### FAQ Item
```
┌─────────────────────────────────────────┐
│ 🚀 How do I get started?          ▼    │ ← Collapsed
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🚀 How do I get started?          ▲    │ ← Expanded
├─────────────────────────────────────────┤
│ Create a family, invite members...      │
└─────────────────────────────────────────┘
```

### Styling Highlights
- **Active Question**: Green background (`rgba(23, 241, 150, 0.1)`)
- **Active Border**: Green border (`#17F196`)
- **Chevron Icon**: Up/Down based on state
- **Answer Box**: Highlighted with green border
- **Contact Button**: Prominent green CTA button

## Translation Keys

### Modal Texts
```json
{
  "profilePage": {
    "modals": {
      "faq": {
        "title": "FAQ & Help",
        "subtitle": "Find answers to common questions",
        "stillNeedHelp": "Still need help?",
        "contactSupport": "Contact Support"
      }
    },
    "faq": {
      "items": {
        "gettingStarted": {
          "question": "How do I get started with Famora?",
          "answer": "Create a family, invite members..."
        }
        // ... more items
      }
    }
  }
}
```

## FAQ Content

### 1. Getting Started (🚀)
**Q:** How do I get started with Famora?  
**A:** Create a family, invite members, and start managing tasks together! You can create tasks, set up a shopping list, and track family activities.

### 2. Add Family Members (👨‍👩‍👧‍👦)
**Q:** How do I add family members?  
**A:** Go to your family settings and use the invite link or email invitation feature. Family members can join using the unique family code.

### 3. Manage Tasks (✅)
**Q:** How do tasks work?  
**A:** Create tasks, assign them to family members, set due dates, and track completion. Completed tasks earn points that contribute to family flames!

### 4. Flames & Points (🔥)
**Q:** What are Flames and Points?  
**A:** Flames are family activity points earned by completing tasks and engaging with the app. They help track your family's productivity and unlock achievements!

### 5. Notifications (🔔)
**Q:** How do I manage notifications?  
**A:** Go to Profile → Communication → Notifications to enable or disable push notifications for family activities, task assignments, and updates.

### 6. Change Password (🔐)
**Q:** How do I change my password?  
**A:** Go to Profile → Personalization → Change Password. Enter your current password and your new password twice to confirm.

### 7. Dark Mode (🌙)
**Q:** How do I enable Dark Mode?  
**A:** Go to Profile → Personalization → Dark Mode and toggle the switch. The app will immediately switch to dark mode.

### 8. Delete Account (⚠️)
**Q:** How do I delete my account?  
**A:** Go to Profile → General → Delete Account. This action is permanent and will delete all your data. Please contact support if you need assistance.

### 9. Contact Support (💬)
**Q:** How do I contact support?  
**A:** You can reach our support team through the FAQ & Help section. Click "Contact Support" to send us an email with your question or concern.

## Interaction Patterns

### Opening FAQ Modal
```typescript
// In settings section
{
  id: 'faq-help',
  title: t('profilePage.sections.communication.faq.title'),
  description: t('profilePage.sections.communication.faq.description'),
  type: 'navigation',
  onPress: () => setShowFaqModal(true),
}
```

### Expanding/Collapsing
```typescript
<Pressable
  style={[
    styles.faqQuestionContainer,
    expandedFaqId === item.id && styles.faqQuestionContainerActive
  ]}
  onPress={() => toggleFaqItem(item.id)}
>
  {/* Question content */}
</Pressable>

{expandedFaqId === item.id && (
  <View style={styles.faqAnswerContainer}>
    <Text style={styles.faqAnswer}>{item.answer}</Text>
  </View>
)}
```

### Contact Support Integration
```typescript
<Pressable
  style={styles.faqContactButton}
  onPress={() => {
    setShowFaqModal(false);
    setTimeout(() => contactSupport(), 300);
  }}
>
  <Text style={styles.faqContactButtonText}>Contact Support</Text>
</Pressable>
```

## Styling Details

### Colors
- **Primary Green**: `#17F196`
- **Active Background**: `rgba(23, 241, 150, 0.1)`
- **Active Border**: `rgba(23, 241, 150, 0.3)`

### Typography
- **Question**: 15px, weight 500 (600 when active)
- **Answer**: 14px, line-height 20px
- **Icon**: 20px emoji

### Spacing
- **Question Padding**: 16px
- **Answer Padding**: 16px
- **Item Margin**: 12px bottom
- **Icon Gap**: 12px

### Animations
- Modal slides up from bottom (`animationType="slide"`)
- Smooth collapse/expand (native React Native behavior)

## Best Practices

1. **Keep Answers Concise** - 2-3 sentences maximum
2. **Use Clear Language** - Avoid jargon
3. **Include Navigation** - Tell users where to find features
4. **Regular Updates** - Keep FAQ content current with app changes
5. **Analytics** - Track which FAQs are most viewed
6. **User Feedback** - Add "Was this helpful?" buttons (future enhancement)

## Future Enhancements

1. **Search Functionality** - Search through FAQ items
2. **Categories** - Group FAQs by topic
3. **Video Tutorials** - Embedded video guides
4. **Helpful Votes** - Track FAQ usefulness
5. **Related Articles** - Show related FAQs
6. **Multi-language** - Add translations for all languages
7. **Deep Links** - Direct links from other parts of the app
8. **Rich Media** - Images and GIFs in answers
9. **Collapsible Categories** - Organize by sections
10. **Search History** - Remember what users search for

## Testing Checklist

- [ ] Modal opens when clicking "FAQ & Help"
- [ ] Questions expand/collapse on tap
- [ ] Only one question can be expanded at a time
- [ ] Chevron icons change direction (up/down)
- [ ] Active states show green highlight
- [ ] Contact Support button opens email
- [ ] Close button dismisses modal
- [ ] Scrolling works with many FAQs
- [ ] Dark mode displays correctly
- [ ] Text is readable and properly formatted
- [ ] Emojis display on all platforms

## Related Files

- `app/(tabs)/profile.tsx` - Main implementation
- `locales/en.json` - English translations
- `contexts/LanguageContext.tsx` - i18n system
- `constants/theme.ts` - Theme colors

## Support

For issues or questions about the FAQ feature, contact the development team or check the main documentation.

---

**Last Updated:** October 30, 2025  
**Version:** 1.0.0  
**Status:** ✅ Complete & Ready


