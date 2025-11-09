Unused Components in  
 src\components

Based on a thorough
search of your codebase,  
 I found 2 components that  
 are no longer in use:

Completely Unused:

1. HomePage.tsx - No
   imports found anywhere
2. ErrorToast.tsx - No  
   imports found anywhere

All Other Components Are
Still In Use:

- ✅ LandingPage
  components (Landing,
  HeroSection,
  ContentInput, SampleQuiz,  
   Features, FeedPage)
- ✅ Quiz components
  (QuizForm,
  CommunityQuizForm, MCQ,  
  GameStatusWrapper,
  TopicCreation, etc.)
- ✅ Chat components
  (Chat, ChatWrapper,
  LeftSideBar,
  RightSideBar, UpsertLink)
- ✅ Statistics
  components (AccuracyCard,  
   ResultsCard,
  TimeTakenCard,
  QuestionsList)
- ✅ Header/Footer
  components
- ✅ Auth components
  (github-sign-in,
  google.sign-in, sign-out)
- ✅ UI components (all  
  in ui folder)
- ✅ Utility components  
  (MarkDown, UploadForm,  
  ProcessContext, Delete,  
  ShareLink, etc.)

Recommendation: You can  
 safely delete
HomePage.tsx and
ErrorToast.tsx if they're  
 legacy code that's no  
 longer needed.
