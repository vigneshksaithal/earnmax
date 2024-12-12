// Learn more at developers.reddit.com/docs
import { Devvit, useState } from '@devvit/public-api';

Devvit.configure({
  redditAPI: true,
});

// Add a menu item to the subreddit menu for instantiating the new experience post
Devvit.addMenuItem({
  label: 'Add my post (EarnMax)',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    ui.showToast("Submitting your post - upon completion you'll navigate there.");

    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: 'My devvit ',
      subredditName: subreddit.name,
      // The preview appears while the post loads
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading ...</text>
        </vstack>
      ),
    });
    ui.navigateTo(post);
  },
});

// Add a post type definition
Devvit.addCustomPostType({
  name: 'Experience Post',
  height: 'regular',
  render: (_context) => {
    const [counter, setCounter] = useState(0);

    return (
      <vstack height="100%" width="100%" gap="medium" alignment="center middle">
        <text size="xxlarge">Choose best</text>
        <text size="large">{`Your earnings: $${counter}`}</text>
        <spacer size='medium'></spacer>
        <hstack>
          <button size='large' appearance="primary" onPress={() => setCounter((counter) => counter + 1)}>
            +$20
          </button>
          <spacer size='medium'></spacer>
          <button size='large' appearance="secondary" onPress={() => setCounter((counter) => counter - 1)}>
            +300c
          </button>
        </hstack>
      </vstack>
    );
  },
});

export default Devvit;
