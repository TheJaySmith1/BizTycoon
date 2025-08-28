import React, { useState } from 'react';

interface SetupScreenProps {
    onCompanyCreated: (name: string) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onCompanyCreated }) => {
    const [companyName, setCompanyName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (companyName.trim()) {
            onCompanyCreated(companyName.trim());
        }
    };

    return (
        <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-md bg-dark-secondary p-8 rounded-lg border border-border-color shadow-2xl">
                <div className="text-center mb-6">
                    <h1 className="text-3xl md:text-4xl font-orbitron text-gray-100 tracking-wider">
                        Found Your <span className="text-brand-gold">Empire</span>
                    </h1>
                    <p className="text-gray-400 mt-2">Every dynasty needs a name. Establish your parent corporation to begin.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="companyName" className="block text-sm font-bold text-brand-blue mb-2">
                            Corporation Name
                        </label>
                        <input
                            type="text"
                            id="companyName"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full bg-dark-primary border border-border-color rounded-md px-3 py-2 text-white placeholder-gray-500 focus:ring-brand-blue focus:border-brand-blue"
                            placeholder="e.g., Apex Global Enterprises"
                            required
                            minLength={3}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mb-6">A one-time incorporation fee of $500,000,000 will be deducted from your starting capital.</p>

                    <button
                        type="submit"
                        disabled={!companyName.trim()}
                        className="w-full px-4 py-3 bg-brand-gold hover:bg-yellow-400 text-dark-primary font-bold rounded-md transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed text-lg"
                    >
                        Establish Corporation
                    </button>
                </form>
            </div>
        </div>
    );
};