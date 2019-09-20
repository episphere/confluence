export const variables = {
    BCAC: {
        contrType: {
            1: 'population-based',
            2: 'hospital-based',
            3: 'family-based',
            4: 'blood donor',
            5: 'nested case-control',
            6: 'BRCA1/2 carrier without bc',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Type of control'
        },
        status: {
            0: 'control',
            1: 'invasive case',
            2: 'in-situ case',
            3: 'case unknown invasiveness',
            9: 'excluded sample',
            'label': 'Case-control status'
        },
        matchId: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'ID of pair or matched case-control set'
        },
        subStudy: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Identifier for within study strata (e.g. multi-ethnic cohort, different recruitement groups, or other strata)'
        },
        studyType: {
            0: 'sporadic',
            1: 'familial',
            2: 'other',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Identifier for within study strata: especially for identification of cohorts with familial cases'
        },
        exclusion: {
            0: 'include',
            3: 'male individual',
            4: 'gender discordance',
            5: 'no phenotypic data',
            6: 'other',
            7: 'non-breast carcinoma',
            8: 'duplicate sample',
            888: "Don't Know",
            'label': 'Reason for exclusion'
        },
        birthDate: {
            '08/08/8000': "Don't Know",
            'label': 'Date of birth '
        },
        birthDate_known: {
            'DMY': 'day,month and year known',
            'MY': 'only month and year known',
            'Y': 'only year known',
            'NA': 'all unknown',
            'label': 'Marker for date of birth'
        },
        bDay: {
            888: "Don't Know",
            'label': 'Day of birth'
        },
        bMonth: {
            888: "Don't Know",
            'label': 'Month of birth'
        },
        bYear: {
            888: "Don't Know",
            'label': 'Year of birth'
        },
        ageInt: {
            888: "Don't Know",
            'label': 'Age at interview/questionnaire for controls and cases'
        },
        intDate : {
            '08/08/8000': "Don't Know",
            'label': 'Date at interview/questionnaire for cases and controls '
        },
        refMonth: {
            888: "Don't Know",
            'label': 'Month of diagnosis of breast cancer for cases and month of completing interview/questionnaire for controls'
        },
        refYear: {
            888: "Don't Know",
            'label': 'Year of diagnosis of breast cancer for cases and year of completing interview/questionnaire for controls'
        },
        AgeDiagIndex: {
            888: "Don't Know",
            'label': 'Age at diagnosis of index breast cancer for cases'
        },
        sex: {
            M: 'male',
            F: 'female',
            U: 'unknown'
        },
        ethnicityClass: {
            1: 'European',
            2: 'Hispanic American',
            3: 'African',
            4: 'Asian Subcontinent',
            5: 'South-East Asian',
            6: 'Other',
            888: "Don't Know",
            'label': 'Ethnic origin'
        },
        ethnicitySubClass: {
            1: 'Northern European',
            2: 'Southern European',
            3: 'Western European',
            4: 'Eastern European',
            5: 'American European',
            6: 'Hispanic American',
            7: 'African (Africa)',
            8: 'Carribbean African',
            9: 'American African',
            10: 'Indian',
            11: 'Pakistani',
            12: 'East and West Bengali',
            13: 'Chinese',
            14: 'Malaysian Peninsula',
            15: 'Japanese',
            16: "Other (including 'mixed race')",
            888: "Don't Know",
            'label': 'Ethnic origin (refined)'
        },
        ethnOt: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Details of specific ethnicity'
        },
        raceM: {
            1: 'European',
            2: 'Hispanic American',
            3: 'African',
            4: 'Asian Subcontinent',
            5: 'South-East Asian',
            6: "Other (including 'mixed race')",
            888: "Don't Know",
            'label': 'Race/ethnicity of mother'
        },
        raceF: {
            1: 'European',
            2: 'Hispanic American',
            3: 'African',
            4: 'Asian Subcontinent',
            5: 'South-East Asian',
            6: "Other (including 'mixed race')",
            888: "Don't Know",
            'label': 'Race/ethnicity of father'
        },
        famHist: {
            0: 'No',
            1: 'Yes',
            888: "Don't Know",
            'label': 'Family history of  breast cancer in a first degree relative'
        },
        fhnumber: {
            888: "Don't Know",
            'label': 'Number of affected (breast cancer) first degree relatives'
        },
        ER_statusIndex: {
            0: 'negative',
            1: 'positive',
            888: "Don't Know",
            'label': 'Estrogen receptor status of index tumour'
        },
        eduCat: {
            'label': 'Highest level of education received'
        },
        eduComments: {
            'label': 'Details of coding used for eduCat'
        },
        ageMenarche: {
            888: "Don't Know",
            'label': 'Age at menarche'
        },
        mensAgeLast: {
            777: 'Not Applicable (still menstruating)',
            888: "Don't Know",
            'label': 'Age at menopause'
        },
        menoStat: {
            1: 'pre/peri',
            2: 'post (postmenopausal: last menstruation more than 12 months before reference date)',
            888: "Don't Know",
            'label': 'Menopausal status at reference date'
        },
        parous: {
            0: 'nulliparous',
            1: '1+ full term pregnancies',
            888: "Don't Know",
            'label': 'Nulliparous v parous'
        },
        parity: {
            888: "Don't Know",
            'label': 'Number of full-term pregnancies'
        },
        ageFFTP: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Age at end of first full-term pregnancy'
        },
        lastChildAge: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Age at end of last full-term pregnancy (or current age if pregnant)'
        },
        breastFed: {
            0: 'No',
            1: 'Yes',
            888: "Don't Know",
            'label': 'Ever breastfed'
        },
        breastMos: {
            888: "Don't Know",
            'label':'Lifetime duration of breastfeeding'
        },
        weight: {
            888: "Don't Know",
            'label': 'Weight at interview/questionnaire'
        },
        height: {
            888: "Don't Know",
            'label': 'Adult body height'
        },
        BMI: {
            'label': 'Body mass index at interview/questionnaire in kg'
        },
        OCEver: {
            0: 'never',
            1: 'ever',
            888: "Don't Know",
            'label': 'Use of oral contraceptives (OC)'
        },
        OCCurrent: {
            0: 'no',
            1: 'yes, i.e. current use at reference date',
            888: "Don't Know",
            'label': 'Current use'
        },
        HRTEver: {
            0: 'never',
            1: 'ever',
            888: "Don't Know",
            'label': 'Use of hormonal replacement therapy (HRT)'
        },
        HRTCurrent: {
            0: 'no',
            1: 'yes, i.e. current use at reference date (only if duration of use >3 months)',
            888: "Don't Know",
            'label': 'Current use'
        },
        EPCurrent: {
            0: 'no',
            1: 'yes, i.e. current use at reference date',
            888: "Don't Know",
            'label': 'Current use of combined therapy'
        },
        ECurrent: {
            0: 'no',
            1: 'yes, i.e. current use at reference date',
            888: "Don't Know",
            'label': 'Current use of estrogen only'
        },
        alcoholCum: {
            888: "Don't Know",
            'label': 'Cumulative lifetime gms/day alcohol'
        },
        smokingEver: {
            0: 'never',
            1: 'past',
            2: 'current, in last year before reference date (year before diagnosis for cases, year before questionnaire for controls)',
            888: "Don't Know",
            'label': 'Cigarette smoking'
        },
        BBD_history: {
            0: 'No',
            1: 'Yes',
            888: "Don't Know",
            'label': 'History of benign breast disease'
        },
        BBD_number: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Number of benign breast disease diagnoses'
        },
        Screen_Ever: {
            0: 'no',
            1: 'yes',
            888: "Don't Know",
            'label': 'Ever attended breast cancer screening'
        },
        Detection_screen: {
            1: 'routine breast cancer screening',
            2: 'other methods of detection',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Mode of detection of first breast cancer diagnosis'
        },
        Index: {
            1: 'ascertained for first tumour',
            2: 'ascertained for second tumour',
            888: "Don't Know",
            'label': 'Identification of index tumour'
        },
        Index_corr: {
            1: 'ascertained for first tumour',
            2: 'ascertained for second tumour',
            'label': 'Identification of index tumour where index is missing (888)'
        },
        Behaviour1: {
            1: 'invasive',
            2: 'in-situ',
            888: "Don't Know",
            'label': 'Invasive or in-situr for first breast cancer'
        },
        Behaviour2: {
            1: 'invasive',
            2: 'in-situ',
            777: 'Not Applicable (if the patient has no second tumour)',
            888: "Don't Know",
            'label': 'Invasive or in-situr for second/contralateral breast cancer'
        },
        BehaviourIndex: {
            1: 'invasive',
            2: 'in-situ',
            888: "Don't Know",
            'label': 'Invasive or in-situr for index tumour'
        },
        Grade1: {
            1: 'well differentiated',
            2: 'moderately differentiated',
            3: 'poorly/un-differentiated',
            888: "Don't Know",
            'label': 'Histopathological grade'
        },
        Grade2: {
            1: 'well differentiated',
            2: 'moderately differentiated',
            3: 'poorly/un-differentiated',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Histopathological grade'
        },
        GradeIndex: {
            1: 'well differentiated',
            2: 'moderately differentiated',
            3: 'poorly/un-differentiated',
            888: "Don't Know",
            'label': 'Histopathological grade for index tumour'
        },
        Stage1: {
            888: "Don't Know",
            'label': 'TNM stage'
        },
        Stage2: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'TNM stage'
        },
        StageIndex: {
            888: "Don't Know",
            'label': 'TNM stage for index tumour'
        },
        Morphology1: {
            888: "Don't Know",
            'label': 'ICD morphology code'
        },
        Morphology2: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'ICD morphology code'
        },
        Morphologygroup1: {
            888: "Don't Know",
            'label': 'Morphology in 8 categories'
        },
        Morphologygroup2: {
            888: "Don't Know",
            'label': 'Morphology in 8 categories'
        },
        Size1: {
            888: "Don't Know",
            'label': 'Tumour size (maximum diameter)'
        },
        Size2: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Tumour size (maximum diameter)'
        },
        SizeIndex: {
            888: "Don't Know",
            'label': 'Tumour size (maximum diameter) for index tumour'
        },
        Size1_Cat: {
            1: '≤2cm',
            2: '>2cm and ≤5cm',
            3: '>5cm',
            888: "Don't Know",
            'label': 'Categorization of size'
        },
        Size2_Cat: {
            1: '≤2cm',
            2: '>2cm and ≤5cm',
            3: '>5cm',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Categorization of size'
        },
        SizeIndex_Cat: {
            1: '≤2cm',
            2: '>2cm and ≤5cm',
            3: '>5cm',
            888: "Don't Know",
            'label': 'Categorization of size for index tumour'
        },
        SizeGroup1: {
            888: "Don't Know",
            'label': 'Tumour size categories'
        },
        SizeGroup2: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Tumour size categories'
        },
        SizeGroupIndex: {
            888: "Don't Know",
            'label': 'Tumour size categories for index tumour'
        },
        M1_status: {
            0: 'M0 (No distant metastasis)',
            1: 'M1 (Distant metastasis)',
            8: 'Mx',
            888: "Don't Know",
            'label': 'M from TNM (distant metastases)'
        },
        M2_status: {
            0: 'M0 (No distant metastasis)',
            1: 'M1 (Distant metastasis)',
            8: 'Mx',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'M from TNM (distant metastases)'
        },
        MIndex_status: {
            0: 'M0 (No distant metastasis)',
            1: 'M1 (Distant metastasis)',
            8: 'Mx',
            888: "Don't Know",
            'label': 'M from TNM (distant metastases) for index tumour'
        },
        Nodes1: {
            888: "Don't Know",
            'label': 'Number of positive nodes'
        },
        Nodes2: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Number of positive nodes'
        },
        NodesIndex: {
            888: "Don't Know",
            'label': 'Number of positive nodes for index tumour'
        },
        NodeStatus1: {
            0: 'LN negative',
            1: 'LN positive',
            888: "Don't Know",
            'label': 'Lymph node status indicator'
        },
        NodeStatus2: {
            0: 'LN negative',
            1: 'LN positive',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Lymph node status indicator'
        },
        NodeStatusIndex: {
            0: 'LN negative',
            1: 'LN positive',
            888: "Don't Know",
            'label': 'Lymph node status indicator for index tumour'
        },
        ER_status1: {
            0: 'negative',
            1: 'positive',
            888: "Don't Know",
            'label': 'Estrogen receptor status of first tumour'
        },
        ER_status2: {
            0: 'negative',
            1: 'positive',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Estrogen receptor status of second tumour'
        },
        ER_statusIndex: {
            0: 'negative',
            1: 'positive',
            888: "Don't Know",
            'label': 'Estrogen receptor status of index tumour'
        },
        ER_status1_source: {
            0: 'clinical records',
            1: 'IHC stain of whole sections',
            2: 'IHC stain of TMAs',
            3: 'other',
            4: 'Derived from Ariol data of TMAs',
            5: 'Derived from semi-quantitative IHC stain data (not defined whether from whole sections or TMAs)',
            888: "Don't Know",
            'label': 'Source of data on ER status of first tumour'
        },
        ER_status2_source: {
            0: 'clinical records',
            1: 'IHC stain of whole sections',
            2: 'IHC stain of TMAs',
            3: 'other',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Source of data on ER status of second tumour'
        },
        ER_statusIndex_source: {
            0: 'clinical records',
            1: 'IHC stain of whole sections',
            2: 'IHC stain of TMAs',
            3: 'other',
            4: 'Derived from Ariol data of TMAs',
            5: 'Derived from semi-quantitative IHC stain data (not defined whether from whole sections or TMAs)',
            888: "Don't Know",
            'label': 'Source of data on ER status of index tumour'
        },
        PR_status1: {
            0: 'negative',
            1: 'positive',
            888: "Don't Know",
            'label': 'Progesteron receptor status of first tumour'
        },
        PR_status2: {
            0: 'negative',
            1: 'positive',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Progesteron receptor status of second tumour'
        },
        PR_statusIndex: {
            0: 'negative',
            1: 'positive',
            888: "Don't Know",
            'label': 'Progesteron receptor status of index tumour'
        },
        PR_status1_source: {
            0: 'linical records',
            1: 'IHC stain of whole sections',
            2: 'IHC stain of TMAs',
            3: 'other',
            4: 'Derived from Ariol data of TMAs',
            5: 'Derived from semi-quantitative IHC stain data (not defined whether from whole sections or TMAs)',
            888: "Don't Know",
            'label': 'Source of data on PR status of first tumour'
        },
        PR_status2_source: {
            0: 'linical records',
            1: 'IHC stain of whole sections',
            2: 'IHC stain of TMAs',
            3: 'other',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Source of data on PR status of second tumour'
        },
        PR_statusIndex_source: {
            0: 'linical records',
            1: 'IHC stain of whole sections',
            2: 'IHC stain of TMAs',
            3: 'other',
            4: 'Derived from Ariol data of TMAs',
            5: 'Derived from semi-quantitative IHC stain data (not defined whether from whole sections or TMAs)',
            888: "Don't Know",
            'label': 'Source of data on PR status of index tumour'
        },
        HER2_status1: {
            0: 'negative',
            1: 'positive',
            888: "Don't Know",
            'label': 'Human epidermal growth factor receptor 2 status of first tumour'
        },
        HER2_status2: {
            0: 'negative',
            1: 'positive',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Human epidermal growth factor receptor 2 status of second tumour'
        },
        HER2_statusIndex: {
            0: 'negative',
            1: 'positive',
            888: "Don't Know",
            'label': 'Human epidermal growth factor receptor 2 status of index tumour'
        },
        HER2_status1_source: {
            0: 'linical records',
            1: 'IHC stain of whole sections',
            2: 'IHC stain of TMAs',
            3: 'other',
            4: 'Derived from Ariol data of TMAs',
            5: 'Derived from semi-quantitative IHC stain data (not defined whether from whole sections or TMAs)',
            888: "Don't Know",
            'label': 'Source of data on HER2 status of first tumour'
        },
        HER2_status2_source: {
            0: 'linical records',
            1: 'IHC stain of whole sections',
            2: 'IHC stain of TMAs',
            3: 'other',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Source of data on HER2 status of second tumour'
        },
        HER2_statusIndex_source: {
            0: 'linical records',
            1: 'IHC stain of whole sections',
            2: 'IHC stain of TMAs',
            3: 'other',
            4: 'Derived from Ariol data of TMAs',
            5: 'Derived from semi-quantitative IHC stain data (not defined whether from whole sections or TMAs)',
            888: "Don't Know",
            'label': 'Source of data on HER2 status of index tumour'
        },
        Bilateral: {
            0: 'unilateral',
            1: 'bilateral (contralateral)',
            2: 'ipsilateral (new primary tumour in the same breast)',
            888: "Don't Know",
            'label': 'Bilaterality status'
        },
        BilateralTime: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Time between first primary and second primary breast cancer (if Bilateral=1 or 2)'
        },
        AgeDiagIndex: {
            888: "Don't Know",
            'label': 'Age of diagnosis of index breast cancer'
        },
        AgeDiag1: {
            888: "Don't Know",
            'label': 'Age of diagnosis of first breast cancer'
        },
        AgeDiag2: {
            777: 'Not Applicable (if the patients has no second tumour)',
            888: "Don't Know",
            'label': 'Age of diagnosis of second/contralateral breast cancer'
        },
        DateDiagIndex: {
            '07/07/7000': 'Not Applicable',
            '08/08/8000': "Don't Know",
            'label': 'Date of diagnosis of index breast cancer'
        },
        DateDiagIndex_known: {
            'DMY': 'day,month and year known',
            'MY': 'only month and year known',
            'Y': 'only year known',
            'NA': 'all unknown',
            'label': 'Marker for date of diagnosis of index breast cancer'
        },
        DateDiag1: {
            '07/07/7000': 'Not Applicable',
            '08/08/8000': "Don't Know",
            'label': 'Date of diagnosis of first breast cancer'
        },
        DateDiag1_known: {
            'DMY': 'day,month and year known',
            'MY': 'only month and year known',
            'Y': 'only year known',
            'NA': 'all unknown',
            'label': 'Marker for date of diagnosis of first breast cancer'
        },
        DateDiag2: {
            '07/07/7000': 'Not Applicable',
            '08/08/8000': "Don't Know",
            'label': 'Date of diagnosis of second/contralateral breast cancer'
        },
        DateDiag2_known: {
            'DMY': 'day,month and year known',
            'MY': 'only month and year known',
            'Y': 'only year known',
            'NA': 'all unknown',
            'label': 'Marker for date of diagnosis of second/contralateral breast cancer'
        },
        DateEnter: {
            '07/07/7000': 'Not Applicable',
            '08/08/8000': "Don't Know",
            'label': 'Date of blood draw/entry into study'
        },
        DateEnter_known: {
            'DMY': 'day,month and year known',
            'MY': 'only month and year known',
            'Y': 'only year known',
            'NA': 'all unknown',
            'label': 'Marker for date of blood draw/entry into study'
        },
        DateLastFU: {
            '07/07/7000': 'Not Applicable',
            '08/08/8000': "Don't Know",
            'label': 'Date of death/last follow-up'
        },
        DateLastFU_known: {
            'DMY': 'day,month and year known',
            'MY': 'only month and year known',
            'Y': 'only year known',
            'NA': 'all unknown',
            'label': 'Marker for date of death/last follow-up'
        },
        YearsToEnter: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Time in years between diagnosis and study entry'
        },
        YearsToStatus: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Time in years between diagnosis and last follow-up'
        },
        VitalStatus: {
            0: 'alive',
            1: 'dead',
            777: 'Not Applicable (for controls)',
            888: "Don't Know",
            'label': 'Vital status at last follow-up'
        },
        CauseDeath: {
            888: "Don't Know",
            'label': 'Cause of death'
        },
        BrDeath: {
            0: 'death from other cause',
            1: 'death from breast cancer',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'If death whether died from breast cancer'
        },
        Locoregional_relapse: {
            0: 'no',
            1: 'yes',
            2: 'Local relapse',
            3: 'Regional relapse to the lymph nodes',
            4: 'both local and regional',
            888: "Don't Know",
            'label': 'Locoregional relapse'
        },
        Date_Locoregional_relapse: {
            '07/07/7000': 'Not Applicable',
            '08/08/8000': "Don't Know",
            'label': 'Date of locoregional relapse'
        },
        Date_Locoregional_relapse_known: {
            'DMY': 'day,month and year known',
            'MY': 'only month and year known',
            'Y': 'only year known',
            'NA': 'all unknown',
            'label': 'Marker for date of locoregional relapse'
        },
        Distant_metastasis_relapse: {
            0: 'no',
            1: 'yes',
            888: "Don't Know",
            'label': 'Distant metastases relapse'
        },
        Date_Distant_metastasis_relapse: {
            '07/07/7000': 'Not Applicable',
            '08/08/8000': "Don't Know",
            'label': 'Date of distant metastasis'
        },
        Date_Distant_metastasis_relapse_known: {
            'DMY': 'day,month and year known',
            'MY': 'only month and year known',
            'Y': 'only year known',
            'NA': 'all unknown',
            'label': 'Marker for date of distant metastasis'
        },
        YearsToRelapse: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Time in years between diagnosis and first relapse'
        },
        Date_Follow_up_relapse: {
            '07/07/7000': 'Not Applicable',
            '08/08/8000': "Don't Know",
            'label': 'Last date that follow-up was updated for relapse'
        },
        Date_Follow_up_relapse_known: {
            'DMY': 'day,month and year known',
            'MY': 'only month and year known',
            'Y': 'only year known',
            'NA': 'all unknown',
            'label': 'Marker for date of follow-up relapse'
        },
        Chemo_adjuvant: {
            0: 'no',
            1: 'yes',
            888: "Don't Know",
            'label': 'Adjuvant chemotherapy'
        },
        Chemo_adjuvant_type: {
            'label': 'Adjuvant chemotherapy drug'
        },
        Chemo_adjuvant_type_corr: {
            'label': 'Adjuvant chemotherapy drug'
        },
        Chemo_adjuvant_dose: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Adjuvant chemotherapy number of cycles'
        },
        Chemo_adjuvant_start: {
            '07/07/7000': 'Not Applicable',
            '08/08/8000': "Don't Know",
            'label': 'Start date'
        },
        Chemo_adjuvant_start_known: {
            'DMY': 'day,month and year known',
            'MY': 'only month and year known',
            'Y': 'only year known',
            'NA': 'all unknown',
            'label': 'Marker for start date of adjuvant chemotherapy'
        },
        Chemo_adjuvant_stop: {
            '07/07/7000': 'Not Applicable',
            '08/08/8000': "Don't Know",
            'label': 'Stop date'
        },
        Chemo_adjuvant_stop_known: {
            'DMY': 'day,month and year known',
            'MY': 'only month and year known',
            'Y': 'only year known',
            'NA': 'all unknown',
            'label': 'Marker for stop date of adjuvant chemotherapy'
        },
        Chemo_anthracycline: {
            0: 'no',
            1: 'yes',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Did the patient receive an Anthracycline therapy?'
        },
        Chemo_anthracycline_corr: {
            0: 'no',
            1: 'yes',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Did the patient receive an Anthracycline therapy?'
        },
        Chemo_taxane: {
            0: 'no',
            1: 'yes',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Did the patient receive Taxanes?'
        },
        Chemo_taxane_corr: {
            0: 'no',
            1: 'yes',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Did the patient receive Taxanes?'
        },
        Chemo_CMF: {
            0: 'no',
            1: 'yes',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Did the patient receive CMF like treatment?'
        },
        Chemo_CMF_corr: {
            0: 'no',
            1: 'yes',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Did the patient receive CMF like treatment?'
        },
        Chemo_adjuvant_duration: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Duration adjuvant treatment in months'
        },
        Horm_adjuvant: {
            0: 'no',
            1: 'yes',
            888: "Don't Know",
            'label': 'Adjuvant anti-hormone therapy'
        },
        Horm_adjuvant_type: {
            'label': 'Adjuvant anti-hormone therapy drug'
        },
        Horm_adjuvant_type_corr: {
            'label': 'Adjuvant anti-hormone therapy drug'
        },
        Horm_adjuvant_start: {
            '07/07/7000': 'Not Applicable',
            '08/08/8000': "Don't Know",
            'label': 'Start date'
        },
        Horm_adjuvant_start_known: {
            'DMY': 'day,month and year known',
            'MY': 'only month and year known',
            'Y': 'only year known',
            'NA': 'all unknown',
            'label': 'Marker for start date of adjuvant anti-hormone therapy'
        },
        Horm_adjuvant_stop: {
            '07/07/7000': 'Not Applicable',
            '08/08/8000': "Don't Know",
            'label': 'Stop date'
        },
        Horm_adjuvant_stop_known: {
            'DMY': 'day,month and year known',
            'MY': 'only month and year known',
            'Y': 'only year known',
            'NA': 'all unknown',
            'label': 'Marker for stop date of adjuvant anti-hormone therapy'
        },
        Horm_adjuvant_duration: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Adjuvant anti-hormone therapy duration in months'
        },
        Trastuzumab_adjuvant: {
            0: 'no',
            1: 'yes',
            888: "Don't Know",
            'label': 'Adjuvant trastuzumab'
        },
        Trastuzumab_adjuvant_start: {
            '07/07/7000': 'Not Applicable',
            '08/08/8000': "Don't Know",
            'label': 'Start date'
        },
        Trastuzumab_adjuvant_start_known: {
            'DMY': 'day,month and year known',
            'MY': 'only month and year known',
            'Y': 'only year known',
            'NA': 'all unknown',
            'label': 'Marker for start date of adjuvant trastuzumab'
        },
        Trastuzumab_adjuvant_stop: {
            '07/07/7000': 'Not Applicable',
            '08/08/8000': "Don't Know",
            'label': 'Stop date'
        },
        Trastuzumab_adjuvant_stop_known: {
            'DMY': 'day,month and year known',
            'MY': 'only month and year known',
            'Y': 'only year known',
            'NA': 'all unknown',
            'label': 'Marker for stop date of adjuvant trastuzumab'
        },
        Trastuzumab_adjuvant_duration: {
            'label': 'Adjuvant trastuzumab duration in weeks'
        },
        Trastuzumab_chemo: {
            0: 'no',
            1: 'yes',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Adjuvant trastuzumab concomitantly with adjuvant chemotherapy'
        },
        Surgery: {
            0: 'no',
            1: 'breast saving',
            2: 'mastectomy (with or without axilary)',
            3: 'type unknown',
            888: "Don't Know",
            'label': 'Breast surgery'
        },
        Radiation: {
            0: 'no',
            1: 'yes, breast',
            2: 'yes, breast and lymph nodes',
            3: 'yes, lymph nodes only',
            4: 'yes, metastases, thoracic spine',
            5: 'yes, organ unknown',
            888: "Don't Know",
            'label': 'Adjuvant radiation'
        },
        Doses: {
            0: 'no',
            1: 'yes',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Available in your study? (do not provide actual data yet)'
        },
        Fields: {
            0: 'no',
            1: 'yes',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Available in your study? (do not provide actual data yet)'
        },
        Chemo_neoadjuvant: {
            0: 'no',
            1: 'yes',
            888: "Don't Know",
            'label': 'Neoadjuvant chemotherapy'
        },
        Chemo_neoadjuvant_type: {
            'label': 'Neoadjuvant chemotherapy drug'
        },
        Chemo_neoadjuvant_type_corr: {
            'label': 'Neoadjuvant chemotherapy drug'
        },
        Chemo_neoadjuvant_dose: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Neoadjuvant chemotherapy number of cycles'
        },
        Chemo_neoadjuvant_start: {
            '07/07/7000': 'Not Applicable',
            '08/08/8000': "Don't Know",
            'label': 'Start date'
        },
        Chemo_neoadjuvant_start_known: {
            'DMY': 'day,month and year known',
            'MY': 'only month and year known',
            'Y': 'only year known',
            'NA': 'all unknown',
            'label': 'Marker for start date of neoadjuvant chemotherapy'
        },
        Chemo_neoadjuvant_stop: {
            '07/07/7000': 'Not Applicable',
            '08/08/8000': "Don't Know",
            'label': 'Stop date'
        },
        Chemo_neoadjuvant_stop_known: {
            'DMY': 'day,month and year known',
            'MY': 'only month and year known',
            'Y': 'only year known',
            'NA': 'all unknown',
            'label': 'Marker for stop date of neoadjuvant chemotherapy'
        },
        Chemo_neoadjuvant_adjuvant_duration: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Duration neoadjuvant treatment in months'
        },
        Chemo_neoadjuvant_anthracycline: {
            0: 'no',
            1: 'yes',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Did the patient receive an Anthracycline therapy?'
        },
        Chemo_neoadjuvant_anthracycline_corr: {
            0: 'no',
            1: 'yes',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Did the patient receive an Anthracycline therapy?'
        },
        Chemo_neoadjuvant_taxane: {
            0: 'no',
            1: 'yes',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Did the patient receive Taxanes?'
        },
        Chemo_neoadjuvant_taxane_corr: {
            0: 'no',
            1: 'yes',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Did the patient receive Taxanes?'
        },
        Chemo_neoadjuvant_CMF: {
            0: 'no',
            1: 'yes',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': ''
        },
        Chemo_neoadjuvant_CMF_corr: {
            0: 'no',
            1: 'yes',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': ''
        },
        Stage_neoadjuvant_pre: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Stage before neoadjuvant treatment'
        },
        NodeStatus1_neoadjuvant_pre: {
            0: 'LN negative',
            1: 'LN positive (clinical)',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Lymph node status indicator before neoadjuvant treatment',
        },
        Size1_neoadjuvant_pre: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Tumour size before neoadjuvant treatment'
        },
        SizeGroup1_neoadjuvant_pre: {
            'label': 'Tumour size before neoadjuvant treatment'
        },
        Stage_neoadjuvant_post: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Stage after neoadjuvant treatment'
        },
        NodeStatus1_neoadjuvant_post: {
            0: 'LN negative',
            1: 'LN positive',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Lymph node status indicator after neoadjuvant treatment'
        },
        Size1_neoadjuvant_post: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Tumour size after neoadjuvant treatment'
        },
        SizeGroup1_neoadjuvant_post: {
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Tumour size after neoadjuvant treatment'
        },
        pCRbreast: {
            1: 'complete response',
            2: 'partial response',
            3: 'no response',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Pathological response breast'
        },
        pCRaxilla: {
            1: 'complete response',
            2: 'partial response',
            3: 'no response',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Pathological axilla'
        },
        CR: {
            1: 'complete response',
            2: 'partial response',
            3: 'no response',
            777: 'Not Applicable',
            888: "Don't Know",
            'label': 'Clinical response by mammography or ultrasound'
        }
    },
    masterFile: {
        core : [
            "iCOGS_ID",
            "Onc_ID",
            "BCAC_ID",
            "Study",
            "contrType",
            "Status",
            "DNA_source",
            "DNA_sourceOt",
            "matchId",
            "SubStudy",
            "Studytype",
            "StudytypeOt",
            "Exclusion",
            "birthDate",
            "birthDate_known",
            "bDay",
            "bMonth",
            "bYear",
            "AgeInt",
            "intDate",
            "intDate_known",
            "intDay",
            "intMonth",
            "intYear",
            "refMonth",
            "refYear",
            "AgeDiagIndex",
            "Sex",
            "EthnicityClass",
            "EthnicitySubClass",
            "ethnOt",
            "raceM",
            "raceF",
            "FamHist",
            "Fhnumber",
            "Fhscore",
            "ER_statusIndex"
        ],
        pathology: [
            "iCOGS_ID",
            "Onc_ID",
            "BCAC_ID",
            "Index",
            "Index_corr",
            "Behaviour1",
            "Behaviour2",
            "BehaviourIndex",
            "Grade1",
            "Grade2",
            "GradeIndex",
            "Stage1",
            "Stage2",
            "StageIndex",
            "Morphology1",
            "Morphology1_corr",
            "Morphology2",
            "Morphology2_corr",
            "MorphologyIndex_corr",
            "MorphologyGroup1",
            "MorphologyGroup1_corr",
            "MorphologyGroup2",
            "MorphologyGroup2_corr",
            "MorphologyGroupIndex_corr",
            "NodeStatus1",
            "NodeStatus2",
            "NodeStatusIndex",
            "Nodes1",
            "Nodes2",
            "NodesIndex",
            "Size1",
            "Size2",
            "SizeIndex",
            "Size1_Cat",
            "Size2_Cat",
            "SizeIndex_Cat",
            "SizeIndex_Cat_derived",
            "SizeGroup1",
            "SizeGroup2",
            "SizeGroupIndex",
            "M1_status",
            "M2_status",
            "MIndex_status",
            "ER_status1",
            "ER_status2",
            "ER_statusIndex",
            "ER_status1_source",
            "ER_status2_source",
            "ER_statusIndex_source",
            "Ariol_ER_Intensity",
            "Ariol_ER_Percentage",
            "PR_status1",
            "PR_status2",
            "PR_statusIndex",
            "PR_status1_source",
            "PR_status2_source",
            "PR_statusIndex_source",
            "Ariol_PR_Intensity",
            "Ariol_PR_Percentage",
            "HER2_status1",
            "HER2_status2",
            "HER2_statusIndex",
            "HER2_status1_source",
            "HER2_status2_source",
            "HER2_statusIndex_source",
            "Ariol_HER2_Score",
            "EGFR_status1",
            "EGFR_status2",
            "EGFR_statusIndex",
            "EGFR_status1_source",
            "EGFR_status2_source",
            "EGFR_statusIndex_source",
            "EGFR_Intensity_Derived",
            "EGFR_Proportion_Derived",
            "EGFR_Percentage",
            "CK56_status1",
            "CK56_status2",
            "CK56_statusIndex",
            "CK56_status1_source",
            "CK56_status2_source",
            "CK56_statusIndex_source",
            "CK56_Intensity_Derived",
            "CK56_Proportion_Derived",
            "CK56_Percentage"
        ],
        riskFactor: [
            "iCOGS_ID",
            "Onc_ID",
            "BCAC_ID",
            "brca12",
            "testDate_BRCA1",
            "testDate_BRCA1_known",
            "testDate_BRCA2",
            "testDate_BRCA2_known",
            "dnaAge",
            "TestSensBRCA1",
            "TestSensBRCA2",
            "eduCat",
            "eduComments",
            "AgeMenarche",
            "mensAgeLast",
            "mensRsn",
            "MenoStat",
            "parous",
            "Parity",
            "AgeFFTP",
            "lastChildAge",
            "breastfed",
            "breastMos",
            "weight",
            "weightAdult",
            "height",
            "weightUsual",
            "weightMax",
            "ageWeightMax",
            "BMI",
            "OCEver",
            "OCCurrent",
            "OCMo",
            "OCStartAge",
            "OCStopAge",
            "OCOtEver",
            "OCOtCurrent",
            "HRTEver",
            "HRTCurrent",
            "HRTMo",
            "HRTStartAge",
            'HRTStopAge',
            "EPEver",
            "EPSort",
            "EPCurrent",
            "EPMo",
            "EPStartAge",
            "EPStopAge",
            "EEver",
            "ECurrent",
            "EMo",
            "EStartAge",
            "EStopAge",
            "RadDiag",
            "RadDiagFirstAge",
            "RadTmt",
            "RadTmtFirstAge",
            "MamNum",
            "screen1age",
            "AlcRegStartAge",
            "alcoholFreq",
            "alcoholCum",
            "AlcType",
            "AlcBeer",
            "AlcWine",
            "AlcFWine",
            "AlcSpirits",
            "AlcGram",
            "smokingEver",
            "smokingCurrent",
            "SmokeYrs",
            "SmokeAvg",
            "SmoRegStartAge",
            "SmoRegStopAge",
            "packyrs",
            "physActRecbrca12",
            "testDate_BRCA1",
            "testDate_BRCA1_known",
            "testDate_BRCA2",
            "testDate_BRCA2_known",
            "dnaAge",
            "TestSensBRCA1",
            "TestSensBRCA2",
            "eduCat",
            "eduComments",
            "AgeMenarche",
            "mensAgeLast",
            "mensRsn",
            "MenoStat",
            "parous",
            "Parity",
            "AgeFFTP",
            "lastChildAge",
            "breastfed",
            "breastMos",
            "weight",
            "weightAdult",
            "height",
            "weightUsual",
            "weightMax",
            "ageWeightMax",
            "BMI",
            "OCEver",
            "OCCurrent",
            "OCMo",
            "OCStartAge",
            "OCStopAge",
            "OCOtEver",
            "OCOtCurrent",
            "HRTEver",
            "HRTCurrent",
            "HRTMo",
            "HRTStartAge",
            "HRTStopAge",
            "EPEver",
            "EPSort",
            "EPCurrent",
            "EPMo",
            "EPStartAge",
            "EPStopAge",
            "EEver",
            "ECurrent",
            "EMo",
            "EStartAge",
            "EStopAge",
            "RadDiag",
            "RadDiagFirstAge",
            "RadTmt",
            "RadTmtFirstAge",
            "MamNum",
            "screen1age",
            "AlcRegStartAge",
            "alcoholFreq",
            "alcoholCum",
            "AlcType",
            "AlcBeer",
            "AlcWine",
            "AlcFWine",
            "AlcSpirits",
            "AlcGram",
            "smokingEver",
            "smokingCurrent",
            "SmokeYrs",
            "SmokeAvg",
            "SmoRegStartAge",
            "SmoRegStopAge",
            "packyrs",
            "physActRec",
            "physActBefore30",
            "physAct30_50",
            "physAct50plus",
            "modPhysActRec",
            "modPhysActBefore30",
            "modPhysAct30_50",
            "modPhysAct50plus",
            "strPhysActRec",
            "strPhysActBefore30",
            "strPhysAct30_50",
            "strPhysAct50plus",
            "walkingRec",
            "walkingBefore30",
            "walking30_50",
            "walking50plus",
            "cyclingRec",
            "cyclingBefore30",
            "cycling30_50",
            "cycling50plus",
            "sittingRec",
            "sittingBefore30",
            "sitting30_50",
            "sitting50plus",
            "houseworkRec",
            "houseworkBefore30",
            "housework30_50",
            "housework50plus",
            "gardeningRec",
            "gardeningBefore30",
            "gardening30_50",
            "gardening50plus",
            "NSAIDs1Ever",
            "NSAIDs1Current",
            "NSAIDs1Start",
            "NSAIDs1Yrs",
            "NSAIDs1Dose",
            "NSAIDs2Ever",
            "NSAIDs2Current",
            "NSAIDs2Start",
            "NSAIDs2Yrs",
            "NSAIDs2Dose",
            "NSAIDs3Ever",
            "NSAIDs3Current",
            "NSAIDs3Start",
            "NSAIDs3Yrs",
            "NSAIDs3Dose",
            "NSAIDs4Ever",
            "NSAIDs4Current",
            "NSAIDs4Start",
            "NSAIDs4Yrs",
            "NSAIDs4Dose",
            "StatinsEver",
            "StatinsCurrent",
            "StatinsStart",
            "StatinsYrs",
            "StatinsDose",
            "sisters",
            "brCancerSis",
            "ovCancerSis",
            "daughters",
            "brCancerDau",
            "ovCancerDau",
            "brCancerMom",
            "ovCancerMom",
            "brCancerDad",
            "FHisFstBC",
            "FHisFstBCNr",
            "FHisSecBC",
            "FHisSecBCNr",
            "FHisFstOC",
            "FHisFstOCNr",
            "FHisSecOC",
            "FHisSecOCNr",
            "fam1grBC50",
            "fam1grOC50",
            "Biopsies_number",
            "BBD_data_collect",
            "BBD_history",
            "BBD_number",
            "BBD_type1",
            "BBD_date1",
            "BBD_age1",
            "BBD_side1",
            "BBD_type2",
            "BBD_date2",
            "BBD_age2",
            "BBD_side2",
            "BBD_type3",
            "BBD_date3",
            "BBD_age3",
            "BBD_side3",
            "BBD_type4",
            "BBD_date4",
            "BBD_age4",
            "BBD_side4",
            "Screen_ever",
            "Last_screen_year",
            "Last_screen_month",
            "Detection_screen",
            "Detection_detailed",
            "MetforminEver",
            "MetforminCurrent",
            "MetforminStart",
            "MetforminYrs",
            "MetforminDose",
            "InsulinEver",
            "InsulinCurrent",
            "InsulinStart",
            "InsulinYrs",
            "InsulinDose",
            "Hypertension",
            "Hypertension_age",
            "CirculatoryDisHeart",
            "CirculatoryDisHeart_age",
            "HeartAttack",
            "HeartAttack_age",
            "Stroke",
            "Stroke_age",
            "Chron_pulmonary_dis",
            "Chron_pulmonary_dis_age",
            "Chron_liver_dis",
            "Chron_liver_dis_age",
            "Chron_bowel_dis",
            "Chron_bowel_dis_age",
            "Chron_blad_kid_dis",
            "Chron_blad_kid_dis_age",
            "Chronic_bronchitis",
            "Chronic_bronchitis_age",
            "Inflamm_dis",
            "Inflamm_dis_age",
            "Osteoporosis",
            "Osteoporosis_age",
            "Diabetes",
            "Diabetes_age",
            "physActBefore30",
            "physAct30_50",
            "physAct50plus",
            "modPhysActRec",
            "modPhysActBefore30",
            "modPhysAct30_50",
            "modPhysAct50plus",
            "strPhysActRec",
            "strPhysActBefore30",
            "strPhysAct30_50",
            "strPhysAct50plus",
            "walkingRec",
            "walkingBefore30",
            "walking30_50",
            "walking50plus",
            "cyclingRec",
            "cyclingBefore30",
            "cycling30_50",
            "cycling50plus",
            "sittingRec",
            "sittingBefore30",
            "sitting30_50",
            "sitting50plus",
            "houseworkRec",
            "houseworkBefore30",
            "housework30_50",
            "housework50plus",
            "gardeningRec",
            "gardeningBefore30",
            "gardening30_50",
            "gardening50plus",
            "NSAIDs1Ever",
            "NSAIDs1Current",
            "NSAIDs1Start",
            "NSAIDs1Yrs",
            "NSAIDs1Dose",
            "NSAIDs2Ever",
            "NSAIDs2Current",
            "NSAIDs2Start",
            "NSAIDs2Yrs",
            "NSAIDs2Dose",
            "NSAIDs3Ever",
            "NSAIDs3Current",
            "NSAIDs3Start",
            "NSAIDs3Yrs",
            "NSAIDs3Dose",
            "NSAIDs4Ever",
            "NSAIDs4Current",
            "NSAIDs4Start",
            "NSAIDs4Yrs",
            "NSAIDs4Dose",
            "StatinsEver",
            "StatinsCurrent",
            "StatinsStart",
            "StatinsYrs",
            "StatinsDose",
            "sisters",
            "brCancerSis",
            "ovCancerSis",
            "daughters",
            "brCancerDau",
            "ovCancerDau",
            "brCancerMom",
            "ovCancerMom",
            "brCancerDad",
            "FHisFstBC",
            "FHisFstBCNr",
            "FHisSecBC",
            "FHisSecBCNr",
            "FHisFstOC",
            "FHisFstOCNr",
            "FHisSecOC",
            "FHisSecOCNr",
            "fam1grBC50",
            "fam1grOC50",
            "Biopsies_number",
            "BBD_data_collect",
            "BBD_history",
            "BBD_number",
            "BBD_type1",
            "BBD_date1",
            "BBD_age1",
            "BBD_side1",
            "BBD_type2",
            "BBD_date2",
            "BBD_age2",
            "BBD_side2",
            "BBD_type3",
            "BBD_date3",
            "BBD_age3",
            "BBD_side3",
            "BBD_type4",
            "BBD_date4",
            "BBD_age4",
            "BBD_side4",
            "Screen_ever",
            "Last_screen_year",
            "Last_screen_month",
            "Detection_screen",
            "Detection_detailed",
            "MetforminEver",
            "MetforminCurrent",
            "MetforminStart",
            "MetforminYrs",
            "MetforminDose",
            "InsulinEver",
            "InsulinCurrent",
            "InsulinStart",
            "InsulinYrs",
            "InsulinDose",
            "Hypertension",
            "Hypertension_age",
            "CirculatoryDisHeart",
            "CirculatoryDisHeart_age",
            "HeartAttack",
            "HeartAttack_age",
            "Stroke",
            "Stroke_age",
            "Chron_pulmonary_dis",
            "Chron_pulmonary_dis_age",
            "Chron_liver_dis",
            "Chron_liver_dis_age",
            "Chron_bowel_dis",
            "Chron_bowel_dis_age",
            "Chron_blad_kid_dis",
            "Chron_blad_kid_dis_age",
            "Chronic_bronchitis",
            "Chronic_bronchitis_age",
            "Inflamm_dis",
            "Inflamm_dis_age",
            "Osteoporosis",
            "Osteoporosis_age",
            "Diabetes",
            "Diabetes_age"
        ],
        survivalAndTreatment: [
            "iCOGS_ID",
            "Onc_ID",
            "BCAC_ID",
            "Bilateral",
            "BilateralTime",
            "AgeDiagIndex",
            "AgeDiag1",
            "AgeDiag2",
            "DateDiagIndex",
            "DateDiagIndex_known",
            "DateDiag1",
            "DateDiag1_known",
            "DateDiag2",
            "DateDiag2_known",
            "DateEnter",
            "DateEnter_known",
            "DateLastFU",
            "DateLastFU_known",
            "YearsToEnter",
            "YearsToStatus",
            "VitalStatus",
            "CauseDeath",
            "BrDeath",
            "Locoregional_relapse",
            "Date_Locoregional_relapse",
            "Date_Locoregional_relapse_known",
            "Distant_metastasis_relapse",
            "Date_Distant_metastasis_relapse",
            "Date_Distant_metastasis_relapse_known",
            "YearsToRelapse",
            "YearsToLocoregionalRelapse",
            "YearsToDistantMetastasisRelapse",
            "Date_Follow_up_relapse",
            "Date_Follow_up_relapse_known",
            "Chemo_adjuvant",
            "Chemo_adjuvant_type",
            "Chemo_adjuvant_type_corr",
            "Chemo_adjuvant_dose",
            "Chemo_adjuvant_start",
            "Chemo_adjuvant_start_known",
            "Chemo_adjuvant_stop",
            "Chemo_adjuvant_stop_known",
            "Chemo_anthracycline",
            "Chemo_anthracycline_corr",
            "Chemo_taxane",
            "Chemo_taxane_corr",
            "Chemo_CMF",
            "Chemo_CMF_corr",
            "Chemo_adjuvant_duration",
            "Horm_adjuvant",
            "Horm_adjuvant_type",
            "Horm_adjuvant_type_corr",
            "Horm_adjuvant_start",
            "Horm_adjuvant_start_known",
            "Horm_adjuvant_stop",
            "Horm_adjuvant_stop_known",
            "Horm_adjuvant_duration",
            "Trastuzumab_adjuvant",
            "Trastuzumab_adjuvant_start",
            "Trastuzumab_adjuvant_start_known",
            "Trastuzumab_adjuvant_stop",
            "Trastuzumab_adjuvant_stop_known",
            "Trastuzumab_adjuvant_duration",
            "Trastuzumab_chemo",
            "Surgery",
            "Radiation",
            "Doses",
            "Fields",
            "Chemo_neoadjuvant",
            "Chemo_neoadjuvant_type",
            "Chemo_neoadjuvant_type_corr",
            "Chemo_neoadjuvant_dose",
            "Chemo_neoadjuvant_start",
            "Chemo_neoadjuvant_start_known",
            "Chemo_neoadjuvant_stop",
            "Chemo_neoadjuvant_stop_known",
            "Chemo_neoadjuvant_duration",
            "Chemo_neoadjuvant_anthracycline",
            "Chemo_neoadjuvant_anthracycline_corr",
            "Chemo_neoadjuvant_taxane",
            "Chemo_neoadjuvant_taxane_corr",
            "Chemo_neoadjuvant_CMF",
            "Chemo_neoadjuvant_CMF_corr",
            "Stage_neoadjuvant_pre",
            "NodeStatus1_neoadjuvant_pre",
            "Size1_neoadjuvant_pre",
            "SizeGroup1_neoadjuvant_pre",
            "Stage_neoadjuvant_post",
            "NodeStatus1_neoadjuvant_post",
            "Size1_neoadjuvant_post",
            "SizeGroup1_neoadjuvant_post",
            "pCRbreast",
            "pCRaxilla",
            "CR"
        ]
    }
};