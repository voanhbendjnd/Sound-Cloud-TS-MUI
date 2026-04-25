'use client' // Error boundaries must be Client Components

export default function GlobalError({
                                        error,
                                        unstable_retry,
                                    }: {
    error: Error & { digest?: string }
    unstable_retry: () => void
}) {
    return (
        // global-error must include html and body tags
        <html>
        <body>
        <h2>Something went wrong global!</h2>
        <button onClick={() => unstable_retry()}>Try again</button>
        </body>
        </html>
    )
}