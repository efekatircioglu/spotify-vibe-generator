import React, { useState, useEffect } from 'react';
import axios from 'axios';

const contributorCache = new Map();

const ContributorSection = ({ title, items }) => {
    if (!items || items.length === 0) return null;
    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <h3 className="popup-role-heading">{title}</h3>
            <ul className="popup-name-list">
                {items.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    );
};

const ContributorFinder = ({ mbid }) => {
    const [contributors, setContributors] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [noRelations, setNoRelations] = useState(false);

    useEffect(() => {
        // ... (The entire useEffect hook for fetching data remains unchanged) ...
    }, [mbid]);

    if (loading) return <div style={{ textAlign: 'center', color: '#a1a1aa', padding: '2rem' }}>Fetching...</div>;
    if (error) return <div style={{ textAlign: 'center', color: '#f87171', padding: '2rem' }}>{error}</div>;
    if (noRelations) return <div style={{ textAlign: 'center', color: '#a1a1aa', padding: '2rem' }}>No Contributor Info Found</div>;

    return (
        <>
            <style jsx global>{`
                .popup-body {
                    max-height: 50vh; overflow-y: auto; padding-right: 0.5rem;
                }
                .popup-body::-webkit-scrollbar { width: 6px; }
                .popup-body::-webkit-scrollbar-track { background: transparent; }
                .popup-body::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
                .popup-body::-webkit-scrollbar-thumb:hover { background: #52525b; }
                .popup-role-heading {
                    font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em;
                    text-transform: uppercase; color: #a1a1aa; margin-bottom: 0.5rem;
                }
                .popup-name-list {
                    list-style: none; padding: 0; margin: 0;
                    color: #f4f4f5; font-weight: 500;
                }
                .popup-name-list li { margin-bottom: 0.375rem; line-height: 1.4; }
            `}</style>
            
            <div className="popup-body">
                <ContributorSection title="Performers" items={contributors.performers} />
                <ContributorSection title="Writers" items={contributors.writers} />
                <ContributorSection title="Producers" items={contributors.producers} />
                <ContributorSection title="Mixing" items={contributors.mixers} />
                <ContributorSection title="Engineering" items={contributors.engineers} />
                <ContributorSection title="Arrangers" items={contributors.arrangers} />
                <ContributorSection title="Remixers" items={contributors.remixers} />
            </div>
        </>
    );
};

export default ContributorFinder;