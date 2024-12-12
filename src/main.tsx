// Learn more at developers.reddit.com/docs
import { Devvit, useState } from '@devvit/public-api';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

type MoneyOption = {
  type: 'dollars' | 'fraction' | 'cents';
  display: string;
  value: number;
};

const generateOptions = (round: number) => {
  const getRandom = (min: number, max: number): number => 
    Math.floor(Math.random() * (max - min + 1)) + min;

  const getRandomFrom = <T,>(arr: readonly T[]): T => 
    arr[Math.floor(Math.random() * arr.length)];

  const getDifficultyMultiplier = (round: number): number => {
    return 1 + (round * 0.5);
  };

  const difficulty = getDifficultyMultiplier(round);

  const generateOption = (): MoneyOption => {
    const optionTypes = round < 3 ? ['dollars'] as const : 
                       round < 6 ? ['dollars', 'fraction'] as const :
                       ['dollars', 'fraction', 'cents'] as const;
    
    const optionType = getRandomFrom(optionTypes);
    
    switch (optionType) {
      case 'dollars': {
        if (round < 3) {
          const value = getRandom(5, 20 * difficulty);
          return {
            type: 'dollars',
            display: `+$${value}`,
            value
          };
        }

        const value1 = getRandom(-20 * difficulty, 50 * difficulty);
        const value2 = getRandom(-10 * difficulty, 30 * difficulty);
        const total = value1 + value2;
        
        return {
          type: 'dollars',
          display: value2 >= 0 ? 
            `$${value1} + $${value2}` :
            `$${value1} - $${Math.abs(value2)}`,
          value: total
        };
      }
      
      case 'fraction': {
        const numerators = [1, 2, 3, 4];
        const denominators = [2, 3, 4, 5];
        const baseAmount = getRandom(50 * difficulty, 200 * difficulty);
        
        const numerator = getRandomFrom(numerators);
        const denominator = getRandomFrom(denominators.filter(d => d > numerator));
        const value = (numerator / denominator) * baseAmount;
        
        return {
          type: 'fraction',
          display: `${numerator}/${denominator} of $${baseAmount}`,
          value
        };
      }
      
      case 'cents': {
        const cents = getRandom(50 * difficulty, 999 * difficulty);
        return {
          type: 'cents',
          display: `${cents}¢`,
          value: cents / 100
        };
      }

      default: {
        // This should never happen, but satisfies TypeScript
        return {
          type: 'dollars',
          display: '+$0',
          value: 0
        };
      }
    }
  };

  const option1 = generateOption();
  let option2: MoneyOption;
  
  do {
    option2 = generateOption();
  } while (Math.abs(option1.value - option2.value) < difficulty);

  return { option1, option2 };
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
    const [round, setRound] = useState(1);
    const [options, setOptions] = useState(() => generateOptions(round));
    const [gameOver, setGameOver] = useState(false);
    const [correctChoices, setCorrectChoices] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const redis = context.redis;

    // Load high scores
    const loadScores = async () => {
      try {
        const [globalHighScore, userEarnings] = await Promise.all([
          redis.get('highScore'),
          redis.get(`earnings:${context.userId}`)
        ]);
        
        if (globalHighScore) {
          setHighScore(Number(globalHighScore));
        }
        if (userEarnings) {
          setEarnings(Number(userEarnings));
        }
      } catch (error) {
        console.error('Failed to load scores:', error);
      }
    };

    // Update scores
    const updateScores = () => {
      Promise.all([
        redis.set('highScore', Math.max(earnings, highScore).toString()),
        redis.set(`earnings:${context.userId}`, earnings.toString())
      ]).then(() => {
        if (earnings > highScore) {
          setHighScore(earnings);
          context.ui.showToast('🏆 New High Score! 🏆');
        }
      }).catch(error => {
        console.error('Failed to update scores:', error);
      });
    };

    // Load scores on mount
    loadScores();

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
        updateScores();
      } else {
        const nextRound = round + 1;
        setRound(nextRound);
        setOptions(generateOptions(nextRound));
      }
    };

    return (
      <vstack height="100%" width="100%" gap="large" alignment="center middle" padding="medium">
        <vstack gap="small" alignment="center middle" width="100%">
          <text size="xxlarge" weight="bold" color="#FF4500">Money Master 💰</text>
          <text size="medium">Pick the option that gives you more money!</text>
          
          {/* Progress bar */}
          <hstack width="50%" padding="small" gap="small">
            {Array.from({ length: 10 }, (_, i) => (
              <vstack 
                height="4px" 
                width="10%" 
                backgroundColor={i < round ? "#FF4500" : "#E5E5E5"}
              />
            ))}
          </hstack>
          
          {/* <text size="small" color="#666666">Round {round}/10</text> */}
        </vstack>
        
        <vstack gap="small" alignment="center middle">
          <text size="xlarge" weight="bold">{`Total Earnings: $${earnings.toFixed(2)}`}</text>
          <hstack gap="medium">
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

            {/* <text size="small" color="#666666">
              Tip: Choose the option that gives you more money! 💡
            </text> */}
          </vstack>
        ) : (
          <vstack gap="medium" alignment="center middle">
            <text size="xlarge" weight="bold">Game Over! 🎮</text>
            <text size="large">{`Final Score: ${correctChoices}/10`}</text>
            <text size="large">{`Total Earnings: $${earnings.toFixed(2)}`}</text>
            <button 
              size="large"
              appearance="primary"
              onPress={() => {
                setEarnings(0);
                setRound(1);
                setGameOver(false);
                setCorrectChoices(0);
                setOptions(generateOptions(1));
              }}
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
