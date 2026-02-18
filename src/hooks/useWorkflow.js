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
        insuranceExpiry: null, // ISO Date String
    },
    phase: 'phase_0_onboarding',
    inputs: {
        postcode: '',
        building_height_meters: 0,
        roof_pitch_degrees: 0,
        loft_inspection_accessible: false,
        site_photos_count: 0,
        roof_area_sqm: 0,
        requiresScaffolding: false,
        isPublicPavement: false,
        sharedParapet: false,
        selectedRepairItems: [], // ['COPING_REPLACEMENT', 'CODE_5_LEAD']
        problemSnapshots: {
            internal_leak: null,
            loft_source: null,
            exterior_panorama: null
        }
    },
    project: {
        startDate: null,
        dailyLogs: [],
        lastUpdateTimestamp: null,
        scaffoldingCertified: false,
        paymentStages: [
            { id: 'deposit', label: '30% Deposit (Escrow)', percent: 30, status: 'pending', requested: false },
            { id: 'mid', label: '40% Interim Payment', percent: 40, status: 'pending', requested: false },
            { id: 'final', label: '30% Final Balance', percent: 30, status: 'pending', requested: false },
        ],
        completionChecklist: [
            { id: 'c1', label: 'Site cleared of debris', checked: false },
            { id: 'c2', label: 'Gutters checked and functional', checked: false },
            { id: 'c3', label: 'All tiles properly fixed (BS 5534)', checked: false },
            { id: 'c4', label: 'Photographic evidence verified', checked: false },
        ],
        variations: [], // { id, reason, extraCost, daysAdded, status: 'pending_approval' | 'approved' | 'rejected' }
        handoverPackGenerated: false,
        handoverPackSent: false,
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

    const MANDATORY_PHOTO_CATEGORIES = useMemo(() => ['Insulation_Check', 'Structural_Fixing'], []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projectState));
    }, [projectState]);

    const isInsuranceValid = useMemo(() => {
        if (!projectState.contractor.insuranceExpiry) return false;
        const expiry = new Date(projectState.contractor.insuranceExpiry);
        const today = new Date();
        return expiry > today;
    }, [projectState.contractor.insuranceExpiry]);

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
        const { building_height_meters, roof_pitch_degrees, roof_area_sqm, requiresScaffolding, isPublicPavement, sharedParapet, selectedRepairItems = [] } = projectState.inputs;
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

        // Transparent Breakdown Logic
        const labourCost = baseCost * 0.65;
        let materialsCost = baseCost * 0.35;

        // 2026 Specialized Repair Items
        let repairItemsCost = 0;
        if (selectedRepairItems.includes('COPING_REPLACEMENT')) repairItemsCost += (area * 0.15) * 135; // York Stone Coping @ £135/m
        if (selectedRepairItems.includes('CODE_5_LEAD')) repairItemsCost += (area * 0.1) * 150; // Code 5 Lead @ £150/m

        materialsCost += repairItemsCost;

        let statutoryFees = 0;
        let statutoryWarnings = [];
        if (requiresScaffolding && isPublicPavement) {
            statutoryFees = 648; // 2026 Rate: Public Highway Scaffolding License
            statutoryWarnings.push("Regulatory Alert: 28-day Local Council lead time required for Public Highway occupation.");
        }

        if (sharedParapet) {
            statutoryWarnings.push("Legal Requirement: Party Wall etc. Act 1996 Notice must be served to neighbor.");
        }

        let logisticsCost = 0;
        if (requiresScaffolding) {
            logisticsCost = (building_height_meters > 5 ? 1200 : 800) + 250; // Scaffolding + Skip Hire
        }

        // Approved variations
        const approvedVariations = variations.filter(v => v.status === 'approved');
        const approvedVariationCost = approvedVariations.reduce((sum, v) => sum + v.extraCost, 0);
        const approvedExtraDays = approvedVariations.reduce((sum, v) => sum + (v.daysAdded || 0), 0);

        const totalCost = labourCost + materialsCost + logisticsCost + statutoryFees + approvedVariationCost;
        const baseDuration = Math.ceil(5 * complexityFactor);
        const totalDurationDays = baseDuration + approvedExtraDays;

        return {
            labourCost,
            materialsCost,
            logisticsCost,
            statutoryFees,
            statutoryWarnings,
            approvedVariationCost,
            totalCost,
            baseDuration,
            approvedExtraDays,
            totalDurationDays,
            weatherContingencyDays: Math.ceil(totalDurationDays * 0.25)
        };
    }, [projectState.inputs, projectState.fixingSpec, projectState.project.variations]);

    const applyVariation = useCallback((reason, extraCost, photoUrl, daysAdded = 0) => {
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
                        daysAdded,
                        photoUrl,
                        status: 'pending_approval',
                        photoRequired: true
                    }
                ]
            }
        }));
    }, []);

    const updateVariationStatus = useCallback((id, status, message = null) => {
        setProjectState(prev => ({
            ...prev,
            project: {
                ...prev.project,
                variations: prev.project.variations.map(v =>
                    v.id === id ? { ...v, status, homeownerMessage: message } : v
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

    const updateSnapshot = useCallback((category, url) => {
        setProjectState(prev => ({
            ...prev,
            inputs: {
                ...prev.inputs,
                problemSnapshots: {
                    ...prev.inputs.problemSnapshots,
                    [category]: url
                }
            }
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

    const verifyScaffolding = useCallback(() => {
        setProjectState(prev => ({
            ...prev,
            project: { ...prev.project, scaffoldingCertified: true }
        }));
    }, []);

    const uploadDailyPhoto = useCallback((tag = 'General') => {
        // Gates daily log until scaffolding is certified if required
        if (projectState.inputs.requiresScaffolding && !projectState.project.scaffoldingCertified) {
            return { success: false, reason: "HSE Compliance Error: Scaffolding Handover Certificate required." };
        }

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
        return { success: true };
    }, [projectState.inputs.requiresScaffolding, projectState.project.scaffoldingCertified]);

    const requestPayment = useCallback((stageId) => {
        // Dynamic Insurance Check
        if (!isInsuranceValid) {
            return { success: false, reason: "Contractor's Public Liability Insurance has expired; work must pause for compliance check." };
        }

        setProjectState(prev => ({
            ...prev,
            project: {
                ...prev.project,
                paymentStages: prev.project.paymentStages.map(s =>
                    s.id === stageId ? { ...s, requested: true } : s
                )
            }
        }));
        return { success: true };
    }, [isInsuranceValid]);

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
    }, [projectState.project.dailyLogs, MANDATORY_PHOTO_CATEGORIES]);

    const sendHandoverEmail = useCallback(() => {
        setProjectState(prev => ({
            ...prev,
            project: { ...prev.project, handoverPackSent: true }
        }));
    }, []);

    const auditProgress = useMemo(() => {
        const uploadedTags = projectState.project.dailyLogs.map(log => log.tag);
        const count = MANDATORY_PHOTO_CATEGORIES.filter(cat => uploadedTags.includes(cat)).length;
        return {
            count,
            total: MANDATORY_PHOTO_CATEGORIES.length,
            ratio: count / MANDATORY_PHOTO_CATEGORIES.length
        };
    }, [projectState.project.dailyLogs, MANDATORY_PHOTO_CATEGORIES]);

    const resetProject = useCallback(() => {
        setProjectState(INITIAL_STATE);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        projectState,
        isInsuranceValid,
        updateInput,
        calculateWindUplift,
        calculateEstimate,
        checkWeatherSafety,
        completeOnboarding,
        startProject,
        verifyScaffolding,
        uploadDailyPhoto,
        updateSnapshot,
        requestPayment,
        releasePayment,
        updateChecklist,
        generateHandoverPack,
        sendHandoverEmail,
        uploadCredential,
        resetProject,
        applyVariation,
        updateVariationStatus,
        auditProgress,
        config: currentPhaseConfig,
    };
};
