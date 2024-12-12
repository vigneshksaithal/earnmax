# Money Master Game

A dynamic game where players need to choose the better monetary option to maximize their earnings.

## Technical Details

- Developed for Reddit's Devvit platform
- Uses Devvit interactive posts API
- Uses Devvit Redis database for persistent storage
- Uses Devvit UI API for rich interface elements

## Features

### Core Gameplay
- Dynamic option generation with random monetary values
- Choice between dollar and cent amounts
- Real-time earnings tracking
- Streak system for consecutive correct choices
- High score persistence across sessions

## How the game works
- The player chooses an option
- There should be a message displayed which shows if its correct or wrong
- And the amount the user chose should be saved and added and shown in earnings
- There should be 10 rounds per session

### Technical Features
- Redis integration for score persistence
- Dynamic UI updates
- Toast notifications for feedback
- Responsive layout
- Error handling

### Game Mechanics
- Random amount generation within balanced ranges
- Variance calculation to ensure fair choices
- Streak bonus system
- High score tracking
- Visual feedback for choices

### UI/UX Features
- Clean, intuitive interface
- Clear value presentation
- Game status indicators
- Helpful tooltips
- Visual feedback for actions

## References

- [Devvit Blocks Overview](https://developers.reddit.com/docs/blocks/overview)
- [Devvit Stacks Documentation](https://developers.reddit.com/docs/blocks/stacks)
- [Devvit Text Components](https://developers.reddit.com/docs/blocks/text)
- [Devvit Button Components](https://developers.reddit.com/docs/blocks/button)
- [Devvit Spacer Components](https://developers.reddit.com/docs/blocks/spacer)
- [Devvit Color System](https://developers.reddit.com/docs/blocks/colors)