// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/n-brace/";
    },
  },{id: "nav-knowledge-base",
          title: "knowledge base",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/n-brace/blog/";
          },
        },{id: "nav-install",
          title: "install",
          description: "Projects belonging to the N-brace",
          section: "Navigation",
          handler: () => {
            window.location.href = "/n-brace/projects/";
          },
        },{id: "nav-contact",
          title: "contact",
          description: "Contact me",
          section: "Navigation",
          handler: () => {
            window.location.href = "/n-brace/contact/";
          },
        },{id: "post-first-version-of-n-brace-has-been-released",
        
          title: "First version of n-brace has been released",
        
        description: "n-brace grows up from an Obsidian plugin into its own standalone app",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/n-brace/blog/first-release/";
          
        },
      },{id: "post-a-roadmap",
        
          title: "a Roadmap",
        
        description: "Roadmap for the N-brace development",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/n-brace/blog/roadmap/";
          
        },
      },{id: "post-a-n-brace-methodology",
        
          title: "a N-brace methodology",
        
        description: "a methodology how to use N-brace for better learning",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/n-brace/blog/methodology/";
          
        },
      },{id: "news-the-first-version-of-the-project-s-home-page-is-nearly-ready-here-we-ll-be-sharing-various-use-cases-and-techniques-for-using-the-n-brace-tool",
          title: 'The first version of the project’s home page is nearly ready! Here, we’ll...',
          description: "",
          section: "News",},{id: "news-project-sitemap-all-official-sources-of-information-about-n-brace",
          title: 'Project sitemap — all official sources of information about N-brace',
          description: "",
          section: "News",handler: () => {
              window.location.href = "/n-brace/news/announcement_2/";
            },},{id: "news-n-brace-obsidian-plugin-has-been-approved",
          title: 'N-brace Obsidian plugin has been approved!',
          description: "",
          section: "News",handler: () => {
              window.location.href = "/n-brace/news/announcement_3/";
            },},{id: "news-first-version-of-n-brace-has-been-released",
          title: 'First version of n-brace has been released!',
          description: "",
          section: "News",handler: () => {
              window.location.href = "/n-brace/news/announcement_4/";
            },},{id: "news-new-reminders-feature-never-lose-track-of-a-note-again",
          title: 'New Reminders feature — never lose track of a note again',
          description: "",
          section: "News",handler: () => {
              window.location.href = "/n-brace/news/announcement_5/";
            },},{id: "projects-the-app",
          title: 'the App',
          description: "standalone application",
          section: "Projects",handler: () => {
              window.location.href = "/n-brace/projects/nbrace_app/";
            },},{id: "projects-obsidian-plugin",
          title: 'Obsidian plugin',
          description: "a plugin to work in obsidian",
          section: "Projects",handler: () => {
              window.location.href = "/n-brace/projects/obsidian_plugin/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%79%6F%75@%65%78%61%6D%70%6C%65.%63%6F%6D", "_blank");
        },
      },{
        id: 'social-inspire',
        title: 'Inspire HEP',
        section: 'Socials',
        handler: () => {
          window.open("https://inspirehep.net/authors/1010907", "_blank");
        },
      },{
        id: 'social-rss',
        title: 'RSS Feed',
        section: 'Socials',
        handler: () => {
          window.open("/n-brace/feed.xml", "_blank");
        },
      },{
        id: 'social-scholar',
        title: 'Google Scholar',
        section: 'Socials',
        handler: () => {
          window.open("https://scholar.google.com/citations?user=qc6CJjYAAAAJ", "_blank");
        },
      },{
        id: 'social-custom_social',
        title: 'Custom_social',
        section: 'Socials',
        handler: () => {
          window.open("https://www.alberteinstein.com/", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
