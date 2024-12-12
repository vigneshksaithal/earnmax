// Learn more at developers.reddit.com/docs
import { Devvit, useState } from '@devvit/public-api';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Helper function to generate random money options
const generateOptions = () => {
  // Generate simple options
  const options = [
    // Simple dollar amounts
    { type: 'dollars', display: '+$20', value: 20 },
    { type: 'dollars', display: '+$50', value: 50 },
    { type: 'dollars', display: '+$10', value: 10 },
    { type: 'dollars', display: '-$5', value: -5 },
    { type: 'dollars', display: '+$20+$20', value: 40 },
    // Fractions
    { type: 'fraction', display: '+3/4 of $100', value: 75 },
    { type: 'fraction', display: '+1/2 of $100', value: 50 },
    { type: 'fraction', display: '-1/3 of $90', value: -30 },
    // Simple cents
    { type: 'cents', display: '+150¢', value: 1.5 },
    { type: 'cents', display: '+299¢', value: 2.99 },
  ];

  // Pick two random different options
  const index1 = Math.floor(Math.random() * options.length);
  let index2;
  do {
    index2 = Math.floor(Math.random() * options.length);
  } while (index1 === index2);

  return {
    option1: options[index1],
    option2: options[index2]
  };
};

Devvit.addMenuItem({
  label: 'Start Money Game',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    ui.showToast("Creating your money game post...");

    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: 'Money Master Challenge 💰',
      subredditName: subreddit.name,
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading Money Game... 💰</text>
        </vstack>
      ),
    });
    ui.navigateTo(post);
  },
});

Devvit.addCustomPostType({
  name: 'Experience Post',
  height: 'regular',
  render: (context) => {
    const [earnings, setEarnings] = useState(0);
    const [options, setOptions] = useState(generateOptions());
    const [round, setRound] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [correctChoices, setCorrectChoices] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const redis = context.redis;

    // Load high score
    const loadHighScore = () => {
      redis.get('highScore').then(savedScore => {
        if (savedScore) {
          setHighScore(Number(savedScore));
        }
      }).catch(error => {
        console.error('Failed to load high score:', error);
      });
    };

    // Update high score
    const updateHighScore = () => {
      if (earnings > highScore) {
        redis.set('highScore', earnings.toString()).then(() => {
          setHighScore(earnings);
          context.ui.showToast('🏆 New High Score! 🏆');
        }).catch(error => {
          console.error('Failed to update high score:', error);
        });
      }
    };

    // Load high score immediately
    loadHighScore();

    const handleChoice = (choice: 'option1' | 'option2') => {
      if (gameOver) return;

      const selectedValue = options[choice].value;
      const otherValue = options[choice === 'option1' ? 'option2' : 'option1'].value;
      const isCorrect = selectedValue > otherValue;
      
      if (isCorrect) {
        setEarnings(prev => prev + selectedValue);
        setCorrectChoices(prev => prev + 1);
        context.ui.showToast(`Correct! ${selectedValue > 0 ? '+' : ''}$${selectedValue.toFixed(2)} 🎯`);
      } else {
        context.ui.showToast('Wrong choice! The other option was better 😅');
      }

      if (round === 10) {
        setGameOver(true);
        updateHighScore();
      } else {
        setRound(prev => prev + 1);
        setOptions(generateOptions());
      }
    };

    const resetGame = () => {
      setEarnings(0);
      setRound(1);
      setGameOver(false);
      setCorrectChoices(0);
      setOptions(generateOptions());
    };

    return (
      <vstack height="100%" width="100%" gap="large" alignment="center middle" padding="medium">
        <vstack gap="small" alignment="center middle">
          <text size="xxlarge" weight="bold" color="#FF4500">Money Master 💰</text>
          <text size="medium">Pick the option that gives you more money!</text>
        </vstack>
        
        <vstack gap="small" alignment="center middle">
          <text size="xlarge" weight="bold">{`Total Earnings: $${earnings.toFixed(2)}`}</text>
          <hstack gap="medium">
            <text size="medium">Round: {round}/10 🎮</text>
            <text size="medium">Score: {correctChoices}/10 ✨</text>
            <text size="medium">High Score: ${highScore.toFixed(2)} 🏆</text>
          </hstack>
        </vstack>

        {!gameOver ? (
          <vstack gap="large" alignment="center middle">
            <hstack gap="large">
              <button 
                size="large" 
                appearance="primary" 
                onPress={() => handleChoice('option1')}
              >
                {options.option1.display}
              </button>
              
              <text size="large" weight="bold">OR</text>
              
              <button 
                size="large" 
                appearance="secondary" 
                onPress={() => handleChoice('option2')}
              >
                {options.option2.display}
              </button>
            </hstack>

            <text size="small" color="#666666">
              Tip: Choose the option that gives you more money! 💡
            </text>
          </vstack>
        ) : (
          <vstack gap="medium" alignment="center middle">
            <text size="xlarge" weight="bold">Game Over! 🎮</text>
            <text size="large">{`Final Score: ${correctChoices}/10`}</text>
            <text size="large">{`Total Earnings: $${earnings.toFixed(2)}`}</text>
            <button 
              size="large"
              appearance="primary"
              onPress={resetGame}
            >
              Play Again 🔄
            </button>
          </vstack>
        )}
      </vstack>
    );
  },
});

export default Devvit;
