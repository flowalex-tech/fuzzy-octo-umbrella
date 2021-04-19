// .vuepress/config.js
module.exports = {
    title: 'Documentation',
    theme: 'vuepress-theme-material-free',
    themeConfig: {
      logo: '/assets/img/my-logo.png',
      authors: {
        'Alex Wolf': {
          image: '/assets/img/avatar.png',
        },
      },
      nav: [
        { label: 'Containers', path: '/containers', icon: 'docker' },
        { label: 'Python', path: '/python', icon: 'python' },
        { label: 'About the author', path: '/about', icon: 'person' },
        { label: 'Tags', path: '/tag', icon: 'category' },
      ],
      footer: {
        text: 'Copyright 2021 All Rights Reserverd',
      },
      tags: {
        'vuejs': 'Vue.js',
        'ruby-on-rails': 'Ruby on Rails',
        'nodejs': 'Node.js',
      },
      locales: {
        default: 'en', // or 'pt-BR'
      },
    },
    plugins: [
        '@vuepress/plugin-last-updated',
        'vuepress-plugin-git-log',
      {
        additionalArgs: '--no-merge',
        onlyFirstAndLastCommit: true,
      },
      'social-share'
      ]
  };
