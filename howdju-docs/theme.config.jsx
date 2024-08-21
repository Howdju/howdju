import { useRouter } from 'next/router'
import { useConfig } from 'nextra-theme-docs'

// https://github.com/shuding/nextra/blob/main/docs/theme.config.tsx
// https://github.com/shuding/nextra/blob/main/examples/swr-site/theme.config.tsx
export default {
  project: {
    link: 'https://github.com/Howdju/howdju'
  },
  useNextSeoProps() {
    const { asPath } = useRouter()
    if (asPath !== '/') {
      return {
        titleTemplate: '%s – Howdju Docs'
      }
    }
  },
  feedback: {
    content: 'Question? Give us feedback →',
    labels: 'docs feedback',
  },
  toc: {
    backToTop: true,
  },
  head: () => {
    const { asPath, defaultLocale, locale } = useRouter()
    const { frontMatter } = useConfig()
    const url =
      'https://docs.howdju.com' +
      (defaultLocale === locale ? asPath : `/${locale}${asPath}`)

    return (
      <>
        <meta property="og:url" content={url} />
        <meta property="og:title" content={frontMatter.title || 'Howdju Docs'} />
        <meta
          property="og:description"
          content={frontMatter.description || 'Documentation for the Howdju crowd-sourced fact-checking platform'}
        />
        <link rel="icon" type="image/png" sizes="32x32" href="https://s3.amazonaws.com/www.howdju.com/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="https://s3.amazonaws.com/www.howdju.com/favicon-16x16.png" />
      </>
    )
  },
  docsRepositoryBase: 'https://github.com/Howdju/howdju/tree/master/howdju-docs',
  logo: (
    <>
      <svg version="1.1" viewBox="0 0 270.93 270.93" xmlns="http://www.w3.org/2000/svg">
        <rect x="-28.945" y="-21.394" width="417.81" height="368.73" fillOpacity="0" strokeWidth=".26458"/>
        <rect x="-43.778" y="-34.218" width="385.45" height="367.34" fill="#2c3e4f" strokeWidth=".26489"/>
        <path d="m86.819 174.73v-10.372q0-8.3961 3.9511-15.064 4.198-6.9144 10.866-10.866 6.9144-3.9511 15.064-3.9511h67.663q3.9511 0 6.6675-2.7164 2.9633-2.9633 2.9633-6.9144v-47.907q0-3.9511-2.9633-6.6675-2.7164-2.9633-6.6675-2.9633h-127.67v-20.743l127.67 0.24694q8.1492 0 14.817 4.198 6.9144 3.9511 10.866 10.866 4.198 6.6675 4.198 15.064v47.907q0 8.1492-4.198 15.064-3.9511 6.6675-10.866 10.866-6.6675 3.9511-14.817 3.9511h-67.663q-3.9511 0-6.9144 2.9633-2.7164 2.7164-2.7164 6.6675v10.372zm0 49.636v-20.249h20.249v20.249z" fill="#fff" strokeWidth=".26458" aria-label="?"/>
      </svg>
      <span style={{ marginLeft: '.4em', fontWeight: 800 }}>
        Howdju Docs
      </span>
    </>
  ),

  footer: {
    text: (
      <div className="flex w-full flex-col items-center sm:items-start">
        <div>
          <a
            className="flex items-center gap-1 text-current"
            target="_blank"
            rel="noopener noreferrer"
            title="nextra.site homepage"
            href="https://nextra.site"
          >
            <span>Built with Nextra</span>
          </a>
        </div>
        <p className="mt-6 text-xs">
          ©{' '}
          Carl Gieringer{' '}
          {new Date().getFullYear()}.
        </p>
      </div>
    )
  }
}
