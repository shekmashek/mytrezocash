import React, { useState, useEffect } from 'react';
import { useBudget } from '../context/BudgetContext';
import { BarChart3, Wallet, Trash2, Plus, TrendingUp, TrendingDown, ArrowRight, ArrowLeft, Home, Building2, Users } from 'lucide-react';
import { mainCashAccountCategories } from '../context/BudgetContext';
import { v4 as uuidv4 } from 'uuid';

const OnboardingStep = ({ step, children, onNext, onPrev, isNextDisabled, isFinalStep, onFinish }) => {
    const steps = [
        { num: 1, label: 'Type' },
        { num: 2, label: 'Projet' },
        { num: 3, label: 'Comptes' },
        { num: 4, label: 'Entrées' },
        { num: 5, label: 'Sorties' },
    ];

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg space-y-8 animate-fade-in">
             <div className="mb-8">
                <ol className="flex items-center w-full">
                    {steps.map((s, index) => (
                        <li key={s.num} className={`flex w-full items-center ${index < steps.length - 1 ? "after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block" : ""} ${step > s.num ? 'after:border-blue-600' : 'after:border-gray-200'}`}>
                            <span className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${step >= s.num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                {s.num}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>
            
            <div className="flex flex-col md:flex-row items-start gap-6">
                <div className={`w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0`}>{step}</div>
                <div className="flex-grow w-full">
                    {children}
                </div>
            </div>

            <div className="pt-6 border-t flex justify-between items-center">
                <button 
                    onClick={onPrev} 
                    className={`px-6 py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-colors ${step > 1 ? 'text-gray-700 bg-gray-200 hover:bg-gray-300' : 'text-gray-400 bg-gray-100 cursor-not-allowed'}`}
                    disabled={step === 1}
                >
                    <ArrowLeft className="w-6 h-6" /> Précédent
                </button>
                {isFinalStep ? (
                    <button 
                        onClick={onFinish} 
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition-transform hover:scale-105"
                    >
                        Lancer mon Projet ! <ArrowRight className="w-6 h-6" />
                    </button>
                ) : (
                    <button 
                        onClick={onNext} 
                        disabled={isNextDisabled}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Suivant <ArrowRight className="w-6 h-6" />
                    </button>
                )}
            </div>
        </div>
    );
};

const OnboardingView = () => {
    const { dispatch } = useBudget();
    
    const [step, setStep] = useState(1);
    const [projectType, setProjectType] = useState('');
    const [projectName, setProjectName] = useState('');
    
    const [currency, setCurrency] = useState('€');
    const [customCurrency, setCustomCurrency] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const predefinedCurrencies = ['€', '$', '£', 'Ar'];

    const [accounts, setAccounts] = useState([{ id: 'temp-1', name: 'Caisse en espèce', initialBalance: 0, initialBalanceDate: new Date().toISOString().split('T')[0], mainCategoryId: 'cash' }]);
    
    const [revenues, setRevenues] = useState([{ id: uuidv4(), description: '', amount: '', supplier: '', frequency: 'mensuel' }]);
    const [expenses, setExpenses] = useState([{ id: uuidv4(), description: '', amount: '', supplier: '', frequency: 'mensuel' }]);

    const projectTypes = [
        { id: 'famille', label: 'Dépenses Familiales', icon: Home },
        { id: 'pme', label: 'PME / PMI', icon: Building2 },
        { id: 'association', label: 'Association', icon: Users },
    ];

    useEffect(() => {
        if (step === 5) {
            if (expenses.length === 1 && expenses[0].description === '' && expenses[0].amount === '') {
                let template = [];
                if (projectType === 'famille') {
                    template = [
                        { description: 'Logement (Loyer/Crédit)', supplier: 'Bailleur/Banque', amount: '', frequency: 'mensuel'},
                        { description: 'Alimentation (Courses)', supplier: 'Supermarché', amount: '', frequency: 'hebdomadaire'},
                        { description: 'Eau et électricité', supplier: 'Fournisseur énergie', amount: '', frequency: 'mensuel'},
                        { description: 'Communication (Internet/Tél)', supplier: 'Opérateur', amount: '', frequency: 'mensuel'},
                        { description: 'Transport (Carburant/Pass)', supplier: 'Station Service', amount: '', frequency: 'mensuel'},
                        { description: 'Entretien des voitures', supplier: 'Garage', amount: '', frequency: 'semestriel'},
                        { description: 'Santé (Mutuelle/Soins)', supplier: 'Mutuelle/Pharmacie', amount: '', frequency: 'mensuel'},
                        { description: 'Éducation & Enfants', supplier: 'École/Garde', amount: '', frequency: 'mensuel'},
                        { description: 'Loisirs', supplier: 'Cinéma/Restaurant', amount: '', frequency: 'mensuel'},
                        { description: 'Vêtements', supplier: 'Magasin', amount: '', frequency: 'trimestriel'},
                        { description: 'Lessive', supplier: 'Supermarché', amount: '', frequency: 'mensuel'},
                        { description: 'Sports', supplier: 'Club de sport', amount: '', frequency: 'mensuel'},
                        { description: 'Épargne & Dettes', supplier: 'Banque', amount: '', frequency: 'mensuel'},
                    ].map(e => ({ ...e, id: uuidv4() }));
                } else if (projectType === 'pme') {
                    template = [
                        { description: "Achats de marchandises (revendues en l'état)", supplier: 'Fournisseur A', amount: '', frequency: 'mensuel' },
                        { description: "Achats de matières premières (transformées)", supplier: 'Fournisseur B', amount: '', frequency: 'mensuel' },
                        { description: "Achats d'emballages", supplier: 'Fournisseur C', amount: '', frequency: 'mensuel' },
                        { description: "Sous-traitance générale et de spécialité", supplier: 'Sous-traitant', amount: '', frequency: 'mensuel' },
                        { description: "Locations (bureaux, matériel, véhicules)", supplier: 'Bailleur', amount: '', frequency: 'mensuel' },
                        { description: "Entretien et réparations (matériel, locaux)", supplier: 'Prestataire', amount: '', frequency: 'trimestriel' },
                        { description: "Primes d'assurance (multirisque, RC pro...)", supplier: 'Assureur', amount: '', frequency: 'annuel' },
                        { description: "Services bancaires (frais, commissions)", supplier: 'Banque', amount: '', frequency: 'mensuel' },
                        { description: "Frais de publicité et marketing", supplier: 'Agence Web', amount: '', frequency: 'mensuel' },
                        { description: "Frais de documentation (abonnements)", supplier: 'Editeur', amount: '', frequency: 'annuel' },
                        { description: "Frais de transport (biens et personnel)", supplier: 'Transporteur', amount: '', frequency: 'mensuel' },
                        { description: "Déplacements, missions et réceptions", supplier: 'Notes de frais', amount: '', frequency: 'mensuel' },
                        { description: "Services postaux et télécommunications", supplier: 'Opérateur Tel', amount: '', frequency: 'mensuel' },
                        { description: "Services informatiques (maintenance, SaaS)", supplier: 'Prestataire IT', amount: '', frequency: 'mensuel' },
                        { description: "Honoraires (avocats, experts-comptables)", supplier: 'Conseil', amount: '', frequency: 'trimestriel' },
                        { description: "Impôts, Taxes et Versements Assimilés", supplier: 'Administration Fiscale', amount: '', frequency: 'trimestriel' },
                        { description: "Salaires bruts et nets", supplier: 'Employés', amount: '', frequency: 'mensuel' },
                        { description: "Charges sociales patronales", supplier: 'Organisme Social', amount: '', frequency: 'mensuel' },
                        { description: "Compléments de salaire (primes, etc.)", supplier: 'Employés', amount: '', frequency: 'annuel' },
                        { description: "Éléments en nature (véhicule, logement)", supplier: 'Employés', amount: '', frequency: 'mensuel' },
                        { description: "Frais de personnel (notes de frais, TR)", supplier: 'Notes de frais', amount: '', frequency: 'mensuel' },
                        { description: "Formation du personnel", supplier: 'Organisme de Formation', amount: '', frequency: 'semestriel' },
                        { description: "Médecine du travail", supplier: 'Service de Santé', amount: '', frequency: 'annuel' },
                        { description: "Intérêts des emprunts et dettes", supplier: 'Banque', amount: '', frequency: 'mensuel' },
                        { description: "Agios bancaires et frais de découvert", supplier: 'Banque', amount: '', frequency: 'mensuel' },
                        { description: "Pénalités et amendes", supplier: 'Administration', amount: '', frequency: 'ponctuel' },
                        { description: "Dons et libéralités", supplier: 'Association', amount: '', frequency: 'ponctuel' },
                    ].map(e => ({ ...e, id: uuidv4() }));
                } else if (projectType === 'association') {
                    template = [
                        { description: 'Frais administratifs', supplier: 'Divers', amount: '', frequency: 'mensuel'},
                        { description: 'Loyer du local', supplier: 'Bailleur', amount: '', frequency: 'mensuel'},
                        { description: 'Communication & Sensibilisation', supplier: 'Imprimeur/Web', amount: '', frequency: 'trimestriel'},
                        { description: 'Frais de mission', supplier: 'Transport', amount: '', frequency: 'mensuel'},
                    ].map(e => ({ ...e, id: uuidv4() }));
                }
                
                if (template.length > 0) {
                    setExpenses(template);
                }
            }
        }
    }, [step, projectType]);

    const handleNext = () => {
        if (step === 1 && !projectType) {
            alert("Veuillez choisir un type de projet.");
            return;
        }
        if (step === 2 && !projectName.trim()) {
            alert("Veuillez donner un nom à votre projet.");
            return;
        }
        if (step === 3 && accounts.some(acc => !acc.name.trim())) {
            alert("Veuillez nommer tous vos comptes de trésorerie.");
            return;
        }
        setStep(s => s + 1);
    };
    const handlePrev = () => setStep(s => s - 1);

    const handleCurrencyChange = (e) => {
        const value = e.target.value;
        if (value === 'custom') {
            setIsCustom(true);
            setCurrency('custom');
        } else {
            setIsCustom(false);
            setCurrency(value);
        }
    };

    const handleFinishSetup = () => {
        if (!projectName.trim()) {
            alert("Veuillez donner un nom à votre projet.");
            setStep(2);
            return;
        }
        if (accounts.some(acc => !acc.name.trim())) {
            alert("Veuillez nommer tous vos comptes de trésorerie.");
            setStep(3);
            return;
        }
        
        const finalCurrency = isCustom ? customCurrency.trim() : currency;
        if (isCustom && !finalCurrency) {
            alert("Veuillez spécifier une devise personnalisée.");
            setStep(2);
            return;
        }

        const fullEntries = [
            ...revenues.filter(r => r.description.trim() && r.amount && r.supplier.trim()).map(r => ({ ...r, type: 'revenu' })),
            ...expenses.filter(e => e.description.trim() && e.amount && e.supplier.trim()).map(e => ({ ...e, type: 'depense' }))
        ];

        dispatch({
            type: 'SETUP_FIRST_PROJECT',
            payload: {
                projectName: projectName.trim(),
                settings: { currency: finalCurrency },
                accounts,
                entries: fullEntries,
            }
        });
    };

    const handleAccountChange = (id, field, value) => {
        setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, [field]: value } : acc));
    };
    const handleAddAccount = () => {
        setAccounts(prev => [...prev, { id: uuidv4(), name: '', initialBalance: 0, initialBalanceDate: new Date().toISOString().split('T')[0], mainCategoryId: 'bank' }]);
    };
    const handleDeleteAccount = (id) => {
        if (accounts.length > 1) {
            setAccounts(prev => prev.filter(acc => acc.id !== id));
        } else {
            alert("Vous devez conserver au moins un compte.");
        }
    };
    const handleEntryChange = (type, id, field, value) => {
        const setter = type === 'revenu' ? setRevenues : setExpenses;
        setter(prev => prev.map(entry => entry.id === id ? { ...entry, [field]: value } : entry));
    };
    const addEntry = (type) => {
        const setter = type === 'revenu' ? setRevenues : setExpenses;
        setter(prev => [...prev, { id: uuidv4(), description: '', amount: '', supplier: '', frequency: 'mensuel' }]);
    };
    const removeEntry = (type, id) => {
        const setter = type === 'revenu' ? setRevenues : setExpenses;
        setter(prev => {
            if (prev.length > 1) return prev.filter(entry => entry.id !== id);
            return prev;
        });
    };

    const frequencyOptions = [
        { value: 'journalier', label: 'par Jour' },
        { value: 'hebdomadaire', label: 'par Semaine' },
        { value: 'mensuel', label: 'par Mois' },
        { value: 'bimestriel', label: 'par Bimestre' },
        { value: 'trimestriel', label: 'par Trimestre' },
        { value: 'semestriel', label: 'par Semestre' },
        { value: 'annuel', label: 'par An' },
    ];

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <OnboardingStep step={1} onNext={handleNext} isNextDisabled={!projectType}>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Pour quel type de projet utiliserez-vous Trezocash ?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {projectTypes.map(({ id, label, icon: Icon }) => (
                                <button key={id} onClick={() => setProjectType(id)} className={`p-6 border-2 rounded-lg text-center transition-all ${projectType === id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400'}`}>
                                    <Icon className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                                    <span className="font-semibold text-gray-800">{label}</span>
                                </button>
                            ))}
                        </div>
                    </OnboardingStep>
                );
            case 2:
                return (
                    <OnboardingStep step={2} onNext={handleNext} onPrev={handlePrev} isNextDisabled={!projectName.trim() || (isCustom && !customCurrency.trim())}>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Détails du Projet</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet *</label>
                                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Ex: Mon Entreprise, Budget Personnel..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg" required autoFocus/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Devise *</label>
                                <select value={isCustom ? 'custom' : currency} onChange={handleCurrencyChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg">
                                    {predefinedCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                                    <option value="custom">Personnalisé...</option>
                                </select>
                                {isCustom && (
                                    <input 
                                        type="text" 
                                        value={customCurrency} 
                                        onChange={(e) => setCustomCurrency(e.target.value)} 
                                        placeholder="Symbole" 
                                        className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg text-lg" 
                                        maxLength="5"
                                    />
                                )}
                            </div>
                        </div>
                    </OnboardingStep>
                );
            case 3:
                return (
                    <OnboardingStep step={3} onNext={handleNext} onPrev={handlePrev} isNextDisabled={accounts.some(acc => !acc.name.trim())}>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Vos Comptes de Trésorerie</h2>
                        <div className="space-y-2 p-4 bg-gray-50 rounded-lg border">
                            {accounts.map(account => (
                                <div key={account.id} className="flex flex-col sm:flex-row items-center gap-2 p-2 border rounded-md bg-white">
                                    <select value={account.mainCategoryId} onChange={(e) => handleAccountChange(account.id, 'mainCategoryId', e.target.value)} className="w-full sm:w-auto px-2 py-1 border-gray-300 rounded-md text-sm">
                                        {mainCashAccountCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                    <input type="text" value={account.name} onChange={(e) => handleAccountChange(account.id, 'name', e.target.value)} placeholder="Nom du compte" className="flex-grow w-full px-2 py-1 border-gray-300 rounded-md text-sm" />
                                    <input type="number" value={account.initialBalance} onChange={(e) => handleAccountChange(account.id, 'initialBalance', e.target.value)} placeholder="Solde initial" className="w-full sm:w-32 px-2 py-1 border-gray-300 rounded-md text-sm" />
                                    <button onClick={() => handleDeleteAccount(account.id)} className="p-1 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                            <button onClick={handleAddAccount} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 pt-2"><Plus className="w-4 h-4" /> Ajouter un compte</button>
                        </div>
                    </OnboardingStep>
                );
            case 4:
                return (
                    <OnboardingStep step={4} onNext={handleNext} onPrev={handlePrev}>
                         <h2 className="text-2xl font-semibold text-gray-800 mb-4">Vos Entrées Périodiques (Optionnel)</h2>
                         <p className="text-sm text-gray-500 mb-4">Listez vos revenus principaux pour démarrer avec une prévision.</p>
                         <div className="space-y-3">
                            {revenues.map(entry => (
                                <div key={entry.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                                    <TrendingUp className="w-5 h-5 text-green-500 md:col-span-1 hidden md:block" />
                                    <input type="text" value={entry.supplier} onChange={(e) => handleEntryChange('revenu', entry.id, 'supplier', e.target.value)} placeholder="Client / Source" className="md:col-span-3 w-full px-3 py-2 border-gray-300 rounded-lg" />
                                    <input type="text" value={entry.description} onChange={(e) => handleEntryChange('revenu', entry.id, 'description', e.target.value)} placeholder="Description" className="md:col-span-3 w-full px-3 py-2 border-gray-300 rounded-lg" />
                                    <input type="number" value={entry.amount} onChange={(e) => handleEntryChange('revenu', entry.id, 'amount', e.target.value)} placeholder="Montant" className="md:col-span-2 w-full px-3 py-2 border-gray-300 rounded-lg" />
                                    <select value={entry.frequency} onChange={(e) => handleEntryChange('revenu', entry.id, 'frequency', e.target.value)} className="md:col-span-2 w-full px-3 py-2 border-gray-300 rounded-lg">
                                        {frequencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <button onClick={() => removeEntry('revenu', entry.id)} className="p-1 text-red-500 hover:text-red-700 md:col-span-1"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                            <button onClick={() => addEntry('revenu')} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Ajouter une entrée</button>
                        </div>
                    </OnboardingStep>
                );
            case 5:
                return (
                    <OnboardingStep step={5} onPrev={handlePrev} isFinalStep={true} onFinish={handleFinishSetup}>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Vos Sorties Périodiques (Optionnel)</h2>
                        <p className="text-sm text-gray-500 mb-4">Listez vos dépenses principales. Nous avons pré-rempli quelques suggestions pour vous.</p>
                        <div className="space-y-3">
                            {expenses.map(entry => (
                                <div key={entry.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                                    <TrendingDown className="w-5 h-5 text-red-500 md:col-span-1 hidden md:block" />
                                    <input type="text" value={entry.supplier} onChange={(e) => handleEntryChange('depense', entry.id, 'supplier', e.target.value)} placeholder="Fournisseur" className="md:col-span-3 w-full px-3 py-2 border-gray-300 rounded-lg" />
                                    <input type="text" value={entry.description} onChange={(e) => handleEntryChange('depense', entry.id, 'description', e.target.value)} placeholder="Description" className="md:col-span-3 w-full px-3 py-2 border-gray-300 rounded-lg" />
                                    <input type="number" value={entry.amount} onChange={(e) => handleEntryChange('depense', entry.id, 'amount', e.target.value)} placeholder="Montant" className="md:col-span-2 w-full px-3 py-2 border-gray-300 rounded-lg" />
                                    <select value={entry.frequency} onChange={(e) => handleEntryChange('depense', entry.id, 'frequency', e.target.value)} className="md:col-span-2 w-full px-3 py-2 border-gray-300 rounded-lg">
                                        {frequencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <button onClick={() => removeEntry('depense', entry.id)} className="p-1 text-red-500 hover:text-red-700 md:col-span-1"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                            <button onClick={() => addEntry('depense')} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Ajouter une sortie</button>
                        </div>
                    </OnboardingStep>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full mx-auto">
                <div className="text-center mb-10">
                    <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h1 className="text-4xl font-bold text-gray-900">Bienvenue sur Trezocash</h1>
                    <p className="text-lg text-gray-600 mt-2">Commençons par faire l'état des lieux de votre projet.</p>
                </div>
                {renderStepContent()}
            </div>
        </div>
    );
};

export default OnboardingView;
