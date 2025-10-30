# Feedback Feature Implementation

## Overview
The feedback feature allows users to submit feedback directly from the profile page. This includes bug reports, feature requests, general comments, and suggestions for improvements.

## Features

### 📝 Feedback Categories
Users can choose from four categories:
- **💬 General** - General feedback and comments
- **🐛 Bug Report** - Report bugs and issues
- **✨ Feature Request** - Suggest new features
- **🚀 Improvement** - Suggest improvements to existing features

### 🎯 Key Features
1. **Multi-line Text Input** - Users can write detailed feedback
2. **Category Selection** - Visual category buttons with icons
3. **User Context** - Automatically includes user info (name, email, family ID)
4. **Notifications** - Success/error notifications after submission
5. **Loading States** - Shows "Submitting..." during submission
6. **Fallback Mechanism** - Opens email client if database submission fails

## User Flow

1. User navigates to Profile → Communication → "Give Feedback"
2. Feedback modal opens
3. User selects a category (default: General)
4. User types their feedback message
5. User clicks "Submit"
6. Success notification appears and modal closes

## Technical Implementation

### Database Schema
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_name TEXT,
  category TEXT CHECK (category IN ('general', 'bug', 'feature', 'improvement')),
  message TEXT NOT NULL,
  family_id UUID REFERENCES families(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### State Management
```typescript
const [showFeedbackModal, setShowFeedbackModal] = useState(false);
const [feedbackCategory, setFeedbackCategory] = useState('general');
const [feedbackMessage, setFeedbackMessage] = useState('');
const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
```

### Submission Logic
1. **Primary Method**: Insert into Supabase `feedback` table
2. **Fallback Method**: Open email client with pre-filled content

### Error Handling
- Empty message validation
- Database error handling
- Network error handling
- Automatic fallback to email

## UI Components

### Feedback Modal
- **Title**: "Give Feedback"
- **Subtitle**: "Help us improve your experience"
- **Category Buttons**: Pill-shaped buttons with icons
- **Text Area**: Multi-line input (6 lines min)
- **Action Buttons**: Cancel and Submit

### Styling
- Consistent with existing modal design
- Active category highlighted in brand green (#17F196)
- Dark mode support
- Disabled state for submit button during submission

## Notifications

### Success
```typescript
showSnackbar('Thank you for your feedback!', 'success', 3000);
```

### Error
```typescript
showSnackbar('Please enter your feedback', 'error', 4000);
```

### Info (Email Fallback)
```typescript
showSnackbar('Opening email client to send feedback', 'info', 3000);
```

## Setup Instructions

### 1. Database Setup
Run the migration file to create the feedback table:
```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL in Supabase Dashboard
# File: supabase/migrations/create_feedback_table.sql
```

### 2. Row Level Security (RLS)
The table automatically includes RLS policies:
- Users can insert their own feedback
- Users can view their own feedback
- (Optional) Admins can view all feedback

### 3. Translation Keys
Add these keys to your language files:

```json
{
  "profilePage": {
    "feedback": {
      "emptyMessage": "Please enter your feedback",
      "success": "Thank you for your feedback!",
      "failed": "Failed to submit feedback. Please try again.",
      "emailFallback": "Opening email client to send feedback"
    },
    "modals": {
      "feedback": {
        "title": "Give Feedback",
        "subtitle": "Help us improve your experience",
        "category": "Category",
        "message": "Your Feedback",
        "placeholder": "Tell us what you think...",
        "submit": "Submit",
        "submitting": "Submitting...",
        "categories": {
          "general": "General",
          "bug": "Bug Report",
          "feature": "Feature Request",
          "improvement": "Improvement"
        }
      }
    }
  }
}
```

## Usage

### Opening the Feedback Modal
```typescript
// In profile page settings
{
  id: 'give-feedback',
  title: t('profilePage.sections.communication.feedback.title'),
  description: t('profilePage.sections.communication.feedback.description'),
  type: 'navigation',
  onPress: () => setShowFeedbackModal(true),
}
```

### Submitting Feedback
```typescript
const handleSubmitFeedback = async () => {
  // Validation
  if (!feedbackMessage.trim()) {
    showSnackbar('Please enter your feedback', 'error', 4000);
    return;
  }

  // Submit to database
  const { error } = await supabase
    .from('feedback')
    .insert([feedbackData]);

  // Handle success/error
  if (!error) {
    showSnackbar('Thank you for your feedback!', 'success', 3000);
    setShowFeedbackModal(false);
  }
};
```

## Admin Dashboard (Future Enhancement)

### Viewing Feedback
Admins can query feedback:
```typescript
const { data: feedback } = await supabase
  .from('feedback')
  .select('*')
  .order('created_at', { ascending: false });
```

### Statistics
- Total feedback count
- Feedback by category
- Recent feedback
- User engagement metrics

## Best Practices

1. **Validation**: Always validate user input before submission
2. **User Context**: Include user info for better tracking
3. **Fallback**: Provide email fallback for reliability
4. **Feedback Loop**: Consider sending confirmation emails
5. **Privacy**: Be transparent about how feedback is used

## Troubleshooting

### Issue: Feedback table doesn't exist
**Solution**: Run the migration file or create the table manually

### Issue: Permission denied
**Solution**: Check RLS policies are correctly set up

### Issue: Submission fails silently
**Solution**: Check console logs and network tab for errors

### Issue: Email fallback doesn't work
**Solution**: Ensure `Linking.openURL` is supported on the platform

## Future Enhancements

1. **Feedback History** - Let users view their past feedback
2. **Reply System** - Allow admins to respond to feedback
3. **Voting System** - Let users upvote feature requests
4. **Status Tracking** - Show feedback status (pending, reviewed, implemented)
5. **Email Notifications** - Send confirmation emails
6. **Screenshots** - Allow users to attach screenshots
7. **Analytics** - Track feedback trends and patterns

## Related Files

- `app/(tabs)/profile.tsx` - Main implementation
- `supabase/migrations/create_feedback_table.sql` - Database schema
- `contexts/SnackbarContext.tsx` - Notification system
- Language files - Translation keys

## Support

For issues or questions about the feedback feature, contact the development team or check the main documentation.


