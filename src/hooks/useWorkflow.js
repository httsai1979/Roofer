import { useState, useCallback, useMemo, useEffect } from 'react';
import rules from '../config/businessRules.json';

const STORAGE_KEY = 'rooftrust_project_state';

const INITIAL_STATE = {
    contractor: {
        name: '',
        registration_number: '',
        isVerified: false,
        onboardingCompleted: false,
        verificationStatus: 'unverified',
        credentialImage: null,
    },
    phase: 'phase_0_onboarding',
    inputs: {
        postcode: '',
        building_height_meters: 0,
        roof_pitch_degrees: 0,
        loft_inspection_accessible: false,
        site_photos_count: 0,
        roof_area_sqm: 0,
    },
    project: {
        startDate: null,
        dailyLogs: [],
        lastUpdateTimestamp: null,
        paymentStages: [
            { id: 'deposit', label: '30% Deposit (Escrow)', percent: 30, status: 'pending' },
            { id: 'mid', label: '40% Interim Payment', percent: 40, status: 'pending' },
            { id: 'final', label: '30% Final Balance', percent: 30, status: 'pending' },
        ],
        completionChecklist: [
            { id: 'c1', label: 'Site cleared of debris', checked: false },
            { id: 'c2', label: 'Gutters checked and functional', checked: false },
            { id: 'c3', label: 'All tiles properly fixed (BS 5534)', checked: false },
            { id: 'c4', label: 'Photographic evidence verified', checked: false },
        ],
        variations: [], // { id, reason, extraCost, status: 'pending_approval' | 'approved' | 'rejected' }
        handoverPackGenerated: false,
        handoverPackSent: false,
        finalPaymentRequested: false,
    },
    milestones: [],
    weather: {
        rain_mm: 0,
        wind_mph: 0,
        temp_c: 15,
    },
    documentType: 'NON_BINDING_ESTIMATE',
    fixingSpec: null,
    coolingOffActive: true,
};

export const useWorkflow = () => {
    const [projectState, setProjectState] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : INITIAL_STATE;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projectState));
    }, [projectState]);

    const currentPhaseConfig = useMemo(() =>
        rules.workflows[projectState.phase] || {},
        [projectState.phase]
    );

    const updateInput = useCallback((key, value) => {
        setProjectState(prev => {
            const newInputs = { ...prev.inputs, [key]: value };
            let newDocType = prev.documentType;
            if (newInputs.loft_inspection_accessible && newInputs.site_photos_count >= 5) {
                newDocType = 'BINDING_QUOTE';
            } else {
                newDocType = 'NON_BINDING_ESTIMATE';
            }
            return { ...prev, inputs: newInputs, documentType: newDocType };
        });
    }, []);

    const calculateWindUplift = useCallback((postcode) => {
        const zones = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'];
        const randomZone = zones[Math.floor(Math.random() * zones.length)];
        const spec = {
            zone: randomZone,
            schedule: "All perimeter tiles twice-fixed; clips required for zones A & B",
            ref: "BS 5534:2014+A2:2018"
        };
        setProjectState(prev => ({ ...prev, fixingSpec: spec }));
        return spec;
    }, []);

    const calculateEstimate = useCallback(() => {
        const { building_height_meters, roof_pitch_degrees, roof_area_sqm } = projectState.inputs;
        const fixingSpec = projectState.fixingSpec;
        const variations = projectState.project.variations || [];

        const baseRate = 120;
        const area = roof_area_sqm || 0;
        const complexityFactor = (building_height_meters > 5 ? 1.2 : 1) * (roof_pitch_degrees > 35 ? 1.15 : 1);

        let windZoneFactor = 1;
        if (fixingSpec && (fixingSpec.zone === 'Zone 3' || fixingSpec.zone === 'Zone 4' || fixingSpec.zone === 'Zone 5')) {
            windZoneFactor = 1.15;
        }

        const baseCost = baseRate * area * complexityFactor * windZoneFactor;

        // Add approved variation costs
        const approvedVariationCost = variations
            .filter(v => v.status === 'approved')
            .reduce((sum, v) => sum + v.extraCost, 0);

        const totalCost = baseCost + approvedVariationCost;
        const durationDays = Math.ceil(5 * complexityFactor);

        return {
            totalCost,
            durationDays,
            weatherContingencyDays: Math.ceil(durationDays * 0.25)
        };
    }, [projectState.inputs, projectState.fixingSpec, projectState.project.variations]);

    const applyVariation = useCallback((reason, extraCost, photoUrl) => {
        setProjectState(prev => ({
            ...prev,
            project: {
                ...prev.project,
                variations: [
                    ...(prev.project.variations || []),
                    {
                        id: Date.now(),
                        reason,
                        extraCost,
                        photoUrl,
                        status: 'pending_approval',
                        photoRequired: true
                    }
                ]
            }
        }));
    }, []);

    const updateVariationStatus = useCallback((id, status) => {
        setProjectState(prev => ({
            ...prev,
            project: {
                ...prev.project,
                variations: prev.project.variations.map(v =>
                    v.id === id ? { ...v, status } : v
                )
            }
        }));
    }, []);

    const checkWeatherSafety = useCallback(() => {
        const { rain_mm, wind_mph, temp_c } = projectState.weather;
        const { safety_thresholds } = rules.weather_monitor_agent;
        if (wind_mph > safety_thresholds.wind_gust_mph ||
            rain_mm > safety_thresholds.precip_mm_hr ||
            temp_c < safety_thresholds.temp_celsius_min) {
            return { safe: false, reason: "Work Suspended: Health & Safety Protocol" };
        }
        return { safe: true };
    }, [projectState.weather]);

    const completeOnboarding = useCallback((contractorData) => {
        const isEligible = contractorData.registration_number.toUpperCase().startsWith('NFRC-');
        setProjectState(prev => ({
            ...prev,
            contractor: {
                ...contractorData,
                isVerified: false,
                verificationStatus: isEligible ? 'pending' : 'unverified',
                onboardingCompleted: true,
            },
            phase: 'phase_1_digital_survey'
        }));
    }, []);

    const uploadCredential = useCallback((imageUrl) => {
        setProjectState(prev => ({
            ...prev,
            contractor: { ...prev.contractor, credentialImage: imageUrl }
        }));
    }, []);

    const startProject = useCallback(() => {
        setProjectState(prev => ({
            ...prev,
            phase: 'phase_2_tracking',
            project: {
                ...prev.project,
                startDate: new Date().toISOString(),
                lastUpdateTimestamp: Date.now()
            }
        }));
    }, []);

    const MANDATORY_PHOTO_CATEGORIES = ['Insulation_Check', 'Structural_Fixing'];

    const uploadDailyPhoto = useCallback((tag = 'General') => {
        setProjectState(prev => ({
            ...prev,
            project: {
                ...prev.project,
                dailyLogs: [
                    ...prev.project.dailyLogs,
                    {
                        date: new Date().toLocaleDateString(),
                        photoUploaded: true,
                        status: 'Completed',
                        tag
                    }
                ],
                lastUpdateTimestamp: Date.now()
            }
        }));
    }, []);

    const releasePayment = useCallback((stageId) => {
        setProjectState(prev => ({
            ...prev,
            project: {
                ...prev.project,
                paymentStages: prev.project.paymentStages.map(s =>
                    s.id === stageId ? { ...s, status: 'released' } : s
                )
            }
        }));
    }, []);

    const updateChecklist = useCallback((itemId, checked) => {
        setProjectState(prev => ({
            ...prev,
            project: {
                ...prev.project,
                completionChecklist: prev.project.completionChecklist.map(item =>
                    item.id === itemId ? { ...item, checked } : item
                )
            }
        }));
    }, []);

    const generateHandoverPack = useCallback(() => {
        const uploadedTags = projectState.project.dailyLogs.map(log => log.tag);
        const missing = MANDATORY_PHOTO_CATEGORIES.filter(cat => !uploadedTags.includes(cat));

        if (missing.length > 0) {
            return { success: false, missing };
        }

        setProjectState(prev => ({
            ...prev,
            project: { ...prev.project, handoverPackGenerated: true }
        }));
        return { success: true };
    }, [projectState.project.dailyLogs]);

    const sendHandoverEmail = useCallback(() => {
        setProjectState(prev => ({
            ...prev,
            project: { ...prev.project, handoverPackSent: true }
        }));
    }, []);

    const requestFinalPayment = useCallback(() => {
        if (!projectState.project.handoverPackSent) return;
        setProjectState(prev => ({
            ...prev,
            project: { ...prev.project, finalPaymentRequested: true }
        }));
    }, [projectState.project.handoverPackSent]);

    const resetProject = useCallback(() => {
        setProjectState(INITIAL_STATE);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        projectState,
        updateInput,
        calculateWindUplift,
        calculateEstimate,
        checkWeatherSafety,
        completeOnboarding,
        startProject,
        uploadDailyPhoto,
        releasePayment,
        updateChecklist,
        generateHandoverPack,
        sendHandoverEmail,
        requestFinalPayment,
        uploadCredential,
        resetProject,
        applyVariation,
        updateVariationStatus,
        config: currentPhaseConfig,
    };
};
