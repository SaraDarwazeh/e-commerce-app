import { useEffect } from 'react';

export default function SEO({ title, description, image }) {
    useEffect(() => {
        if (title) {
            document.title = `${title} | GoldBag`;
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) ogTitle.setAttribute('content', title);

            const twitterTitle = document.querySelector('meta[property="twitter:title"]');
            if (twitterTitle) twitterTitle.setAttribute('content', title);
        }

        if (description) {
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) metaDescription.setAttribute('content', description);

            const ogDescription = document.querySelector('meta[property="og:description"]');
            if (ogDescription) ogDescription.setAttribute('content', description);

            const twitterDescription = document.querySelector('meta[property="twitter:description"]');
            if (twitterDescription) twitterDescription.setAttribute('content', description);
        }
    }, [title, description, image]);

    return null;
}
