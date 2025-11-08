"use client"

import * as React from "react"

// ACTUAL MEDICAL DATA FROM CLINIC
const initialMedicines = [
  "ACUPAT EYE DROP", "LOTEL LS EYE DROP", "Norzen eye drops", "Ciplox eye drops", "Zoxan eye drops", "Cifran eye drops",
  "Diamox Tablet (250 mg)", "Betnesol-N Eye drops", "Dexament-N Eye Drops", "Tropicacyl Plus Eye Drops", "Cyclomid Eye Drops",
  "Tropicamet Plus Eye Drops", "Atropine Eye Drops", "Atropine Eye Ointment", "Zofenax Eye Drops", "Dicloran Eye Drops",
  "Brufen (200 mg) Tablet", "Brufen (400 mg) Tablet", "Kinetone Capsule", "Nuclav (375 mg) Tablet", "Nausidome Tablet",
  "Digene Tablet", "Digene Gel", "Tablet Deltaflam", "Floxigaurd Eye Drops", "Pyrimon Eye Drops", "Pychlor Eye Drops",
  "Dexament - N Eye Drops", "Bleph  Eye Drops", "Lacrigel Eye Ointment", "Tearplus Eye Drops", "Liquiflim Tears",
  "Nudoxy Tablet", "Tablet Neurotrat", "Osmotek Eye Drops", "Moisol Eye Drops", "Toba Eye Drops", "Genticyin Inj.",
  "Toba - DM Eye Drops", "Pilomax  2.0%  Eye Drops", "Zoxan Eye Ointment", "Ketlur Eye Drops", "Vorac Eye Drops",
  "Chlormixin Eye Drops", "Chlormixin Eye Ointment", "Chlormixin - D Eye Ointment", "Timolet Eye Drops 0.5%",
  "Acivir Eye Ointment", "Cromal Eye Drops", "Ciplox Eye Ointment", "Optipress Eye Drops", "Optipress - S Eye Drops",
  "Tablet Theragram - M", "COMBIGAN EYE DROP", "LATACOM", "VIGAMOX", "SYSTANE ULTRA", "REFRESH TEARS", "ZYMAR",
  "LUMIGAN", "XALATAN", "ALPHAGAN", "TRAVATAN", "AZARGA", "GANFORT", "SIMBRINZA", "DUOTRAV", "COSOPT"
]

const initialTreatments = [
  "FOREIGNBODY", "GLAUCOMA", "ANIRIDIA", "COLOBOMA OF IRIS", "PTOSIS", "BLEPHAROSPASM", "CHALAZION", "BLEPHARITIS",
  "LENS INDUCED GLAUCOMA", "PINGUECULUM", "PTERYGIUM", "PHLYCTENULAR KERATOCONJUNCTIVITIS", "SYMBLEPHARON",
  "MEGALOCORNEA", "MICRO CORNEA", "KERATOCONUS", "CORNEAL ULCER", "INTERSTITIAL KERATITIS", "RETINO BLASTOMA",
  "ECTOPIA LENTIS", "RETINITIS PIGMENTOSA", "OPTIC ATROPHY", "HORDEOLUM-EXTERNAL", "CATARACT IN RIGHT EYE",
  "CATARACT IN LEFT EYE", "AMBLYLAOPIA", "CORNEAL FOLDS", "POOR ENDOTHELIAL COUNT", "NLD BLOCK",
  "CATARACT IN BOTH EYE", "GLAUCOMMATOUS DAMAGE", "CLEAR", "Post Subcapsular Cataract", "POST POLAR",
  "Cortical Age Related Cataract", "NUCLEAR SCL -1", "NUCLEAR SCL -2", "NUCLEAR SCL -3", "NUCLEAR SCL -4",
  "IOL", "Mature Cataract  age related", "CONJUCTIVITIS", "ALLERGIC CONJUCTIVITIS", "IRIDOCYCLITIS", "SCH",
  "PCO", "FILAMENTARY KERATITIS", "YAG LASER", "STYE", "ENDOPHTHALMTIS", "SPK", "EPITHELIAL DEFECT",
  "THIRD NERVE PALSY", "EARLY PCO", "HERPES", "VIRAL KERETITIES", "FUNGAL KERATITIES", "SUTURAL CATARACT",
  "CORNEAL SCAR", "SEASONAL ALLERGIC", "DRY EYE", "VERNAL CONJUCTIVITIS", "UVETIC GLAUCOMA", "EARLY CATARACT",
  "APHAKIA", "CORNEAL OPACITY", "PXF", "CSR {MACULA}", "OTPIC NEURITIS", "POST HERPETIC SECONDARY GLAUCOMA",
  "MGD", "MIGRAINE", "DIABETIC", "SCLERITIS", "HIGH MYOPIA", "MICRO SPORIDIAL KERATITIS",
  "BELL'S PALSY (FACIAL NERVE)", "DACRYOCYSTITIS", "SQUINT EYE", "MYOPIA", "LR PALSY (SIXTH NERVE)",
  "PSC + NS", "ADVICE PHACO SURGERY WITH IOL IMPLANTATION", "LASIK", "ADENOVIRUS CONJUNCTIVITIS",
  "Diplopia", "cortical cataract", "PTERYGIUM DONE", "Dacrycystitis with Lacrimal Sac Abscess",
  "Flotter in Eyes", "YAG LASER DONE", "CONCRETION", "White Mature Cataract", "Early PSC",
  "CORTICAL +PSC", "EPISCLERITIS", "ALTERNATE EXOTROPIA", "PSC+CORTICAL", "PBK", "PUK", "EXOPHORIA",
  "CME", "Macular Degenration", "Barrage Laser Done", "Senile Ectropion", "MULTIPLE LATTICE", "EXOTROPIA",
  "PSEUDOPHAKIA", "UPPER LID CYST", "ITCHING", "ENTROPION", "ECTROPION", "Mild NPDR",
  "Diabetic Macular Edema", "Post Op CME", "Choroidal NEO Vascular Membrane (CNVM)",
  "Advice Intra Vitreal Anti Vegf Inj", "Neo Vascular Glaucoma", "Advice Right eye PRP Laser",
  "Advice Left eye PRP Laser", "Keratitis", "psc", "Ptosis Scleral", "Papilledema",
  "Primary Open Angle Glucoma", "Lattice Degeneration", "C3R", "SICS", "NUCLEAR SCL- 5",
  "Ocular Hypertension", "PPC- Posterior Polar Cataract", "Flickering of Eyes", "Forme Fruste Keratoconus",
  "Advance Keratoconus", "S/P Trabeculectomy", "Microbial Keratitis - Pseudomonas", "Hyper Mature Cataract",
  "Haemorrhage Conjuctivitis", "Lattice Degeneration with Holes", "S/P YAG Capsulotomy",
  "Intermittent Exotropia", "Epidemic Keratoconjunctivitis", "Retrobulbar Neuritis", "Blue Dot Cataract",
  "CCC- Chronic Cicatrizing Conjunctivitis", "Macular Retinal Scar", "Subluxated IOL", "Twitching",
  "Hypermetropia", "S/P Scleral Buckle", "FHI- Fuchs Heretochromic Iridocyclitis", "Homonymous Hemianopia",
  "PPCD - Posterior Polymorphous Corneal dystrophy", "Positive Dysphotopsia", "Viral Conjunctivitis",
  "Choroidal Granuloma", "Fuch Distrophy", "ADVICE BOTH EYE LASIK SURGERY", "PRP Laser",
  "Sixth Nerve palsy", "Developmental cataract", "Advice Injection IVTA", "Injection IVTA Given",
  "Intra Vitreal Anti Vegf Inj Given", "Advice  ICL Surgery",
  "Drry Eye Disease : Aqueous Def > Evaporative", "BRAO- Branched Retinal Artery Occl"
]

const initialSurgeries = [
  "FOREIGNBODY", "GLAUCOMA", "ANIRIDIA", "COLOBOMA OF IRIS", "PTOSIS", "BLEPHAROSPASM", "CHALAZION", "BLEPHARITIS",
  "LENS INDUCED GLAUCOMA", "PINGUECULUM", "PTERYGIUM", "PHLYCTENULAR KERATOCONJUNCTIVITIS", "SYMBLEPHARON",
  "MEGALOCORNEA", "MICRO CORNEA", "KERATOCONUS", "CORNEAL ULCER", "INTERSTITIAL KERATITIS", "RETINO BLASTOMA",
  "ECTOPIA LENTIS", "RETINITIS PIGMENTOSA", "OPTIC ATROPHY", "HORDEOLUM-EXTERNAL", "CATARACT IN RIGHT EYE",
  "CATARACT IN LEFT EYE", "AMBLYLAOPIA", "CORNEAL FOLDS", "POOR ENDOTHELIAL COUNT", "NLD BLOCK",
  "CATARACT IN BOTH EYE", "YAG LASER", "LASIK", "STYE", "C3R", "SICS", "C3R DONE",
  "CATARACT ( PHACOEMULSIFICATION) + IOL", "DCR- EXTERNAL", "LEFT EYE", "RIGHT EYE", "Trabeculectomy",
  "Vitrectomy", "Corneal Transplant", "Retinal Detachment Surgery", "Pterygium Excision",
  "Entropion Repair", "Ectropion Repair", "Ptosis Correction", "Dacryocystorhinostomy",
  "Evisceration", "Enucleation", "Orbital Decompression", "Strabismus Surgery"
]

const initialDiagnosis = [
  "PANOPHTHALMITIS", "ACUTE CONJUNCTIVITS", "ACUTE DACRYOCYSTITIS", "ADENOVIRUS CONJUNCTIVITIS",
  "AGE RELATED MACULAR DEGENERATION", "ALLERGIC CONJUCTIVITIS", "ALLERGIC OEDEMA", "AMBLYOPIA",
  "AMYLOIDOSIS", "ANOPHTHALMIC SOCKET", "ANTERIOR UVEITIS", "ATROPHIC BULBI", "AXIAL PROPTOSIS",
  "BACTERIAL CONJUNCTIVITIS", "BELL'S PALSY (FACIAL NERVE)", "BLEPHARITIS", "BLEPHAROPHIMOSIS",
  "BLEPHAROSPASM", "BLUNT TRAUMA", "BOTH EYE WITHIN NORMAL LIMITS", "BROWN CATARACT", "CANALICULAR BLOCK",
  "CANALICULITIS", "CARUNCULAR CYST", "CATARACT IN BOTH EYE", "CATARACT IN LEFT EYE", "CATARACT IN RIGHT EYE",
  "CELLULITIS", "CHALAZION", "CHEMOSIS", "CHRONIC DACRYOCYSTITIS", "CHRONIC PROGRESSIVE EXTERNAL OPHTHALMOPLEGIA",
  "CLEAR", "CNVM", "CONGENITAL ENTROPION", "CONGENITAL NASOLACRIMAL DUCT OBSTRUCTION", "CONGENITAL PTOSIS",
  "CONGESTION", "CONJUCTIVITIS", "CONJUNCTIVAL NEVUS", "CONTACT LENS INDUCED KERATITIS",
  "CONVERGENCE INSUFFICIENCY", "CORNEAL ABRASIONS", "CORNEAL DYSTROPHY", "CORNEAL OPACITY", "CORNEAL ULCER",
  "CORNEO-SCLERAL TEAR", "CSR {MACULA}", "DACRYCYSTITIS WITH LACRIMAL SAC ABSCESS", "DACRYOADENITIS",
  "DACRYOCYSTITIS", "DACRYOPS", "DARK CIRCLES", "DEEP SOCKET", "DERMATOCHALASIS", "DRY EYE", "EARLY CATARACT",
  "ECTROPION", "ENTROPION", "EPICANTHUS INVERSUS", "EPISCLERITIS", "ESSENTIAL BLEPHAROSPASM", "EXOPHORIA",
  "EXOTROPIA", "EXTRUDED INTUBATION TUBE", "EYELID LAXITY", "EYELID MASS", "EYELID OEDEMA", "EYELID RETRACTION",
  "FACIAL NERVE PALSY ? LMN", "FAILED DCR", "FAT PROLAPSE", "FLOATERS", "FOREIGNBODY", "FRONTAL BOSSING",
  "GLAUCOMA", "GLAUCOMA SUSPECT", "GLOBE RUPTURE", "GRANULOMA", "HEADACHE", "HEMANGIOMA", "HEMIFACIAL SPASM",
  "HIGH MYOPIA", "HORDEOLUM-EXTERNAL", "HORDEOLUM/STYE", "HYPEPIGMENTATION", "HYPER MATURE CATARACT",
  "HYPERMETROPIA", "HYPOTROPIA", "INCLUSION CYST", "INTRAORBITAL FOREIGN BODY", "LAGOPHTHALMOS",
  "LASERED RETINA", "LASIK", "LENS CHANGES", "LID CYST", "LID LACERATION", "LID LAXITY", "LID MASS",
  "LID OEDEMA", "LOWER EYELID MASS", "LOWER EYELID SCARRING", "LSCD", "MACULAR OEDEMA", "MATURE CATARACT",
  "MAXILLARY BONE FRACTURE", "MIGRAINE", "MOLLUSCUM CONTAGIOSUM", "MULTIPLE FACIAL FRACTURES", "MYOPIA",
  "MYOPIC ASTIGMATISM", "NASAL PTERYGIUM", "NASOLACRIMAL DUCT OBSTRUCTION", "NEUROFIBROMATOSIS NF1", "NEVUS",
  "NLD BLOCK", "NORMAL", "NPDR", "NUCLEAR SCL -2", "OCULAR MYASTHENIA", "OPTIC ATROPHY", "ORBITAL CELLULITIS",
  "ORBITAL FLOOR FRACTURE", "ORBITAL INJURY", "ORBITAL MASS", "ORBITAL PSEUDOTUMOUR", "ORBITAL RIM FRACTURE",
  "OSSN", "PAINFUL BLIND EYE", "PANNUS", "PANSINUSITIS", "PARTIAL BLOCK", "PATHOLOGICAL MYOPIA", "PCO",
  "PERIORBITAL OEDEMA", "PINGECULA", "POST DCR", "POST LASIK", "PPC- POSTERIOR POLAR CATARACT",
  "PRE LASIK WORKUP", "PRESBYOPIA", "PRESEPTAL CELLULITIS", "PSCC", "PSEUDOMEMBRANOUS CONJUNCTIVITIS",
  "PSEUDOPHAKIA", "PTERYGIUM", "PTOSIS", "PTOSIS- BOTH EYES", "PUNCTAL EVERSION", "PUNCTAL STENOSIS",
  "PYOCELE", "PYOGENIC GRANULOMA", "REFRACTIVE ERROR", "RETINAL DETACHMENT", "RETINITIS PIGMENTOSA",
  "RIGHT EYE EYELID MASS", "RIGHT EYE LID DERMOLIPOMA", "ROAD TRAFFIC ACCIDENT", "S/P BARRAGE LASER",
  "S/P BLEPHAROPLASTY", "S/P CATARACT", "S/P CP ANGLE TUMOUR", "S/P DCR", "S/P ECTROPION", "S/P ENTROPION",
  "S/P ENUCLEATION", "S/P EXCISION", "S/P FRILL EVISCERATION", "S/P KERATOPLASTY", "S/P LASIK",
  "S/P LATERAL TARSAL STRIP", "S/P LID LACERATION REPAIR", "S/P LID RECONSTRUCTION", "S/P MASS EXCISION",
  "S/P MEDIAL SPINDLE ROTATION", "S/P ORBITAL FLOOR FRACTURE REPAIR", "S/P ORBITAL FLOOR PLATING",
  "S/P ORBITAL MASS EXCISION", "S/P PROBING", "S/P PTERYGIUM", "S/P PTOSIS SURGERY", "S/P PUNCTAL SNIP",
  "S/P SCLERAL SPACER + ECTROPION", "S/P SCLERAL TEAR", "S/P SICS", "S/P SNIP PROCEDURE",
  "S/P SUBPREIOSTEAL ABSCESS DRAINAGE", "S/P VR SURGERY", "S/P YAG CAPSULOTOMY", "SCLERAL TEAR",
  "SEBACEOUS CYST", "SENILE ENTROPION", "SENILE IMMATURE CATARACT", "SENILE PTOSIS", "SEVERE DRY EYE",
  "SILICON IMPLANT EXTRUSION", "SIMPLE MYOPIA", "SLE", "STYE", "SUB-CONJUNCTIVAL HEMORHAGE",
  "SUB-PERIOSTEAL ABSCESS", "TARSAL MASS", "TEAR TROUGH DEFECT", "THYROID EYE DISEASE",
  "THYROID ORBITOPATHY", "TRAUMATIC CATARACT", "TRAUMATIC PTOSIS", "TRAUMATIC UVEITIS", "TRICHIATIC EYELASH",
  "UPPER LID CYST", "VERNAL CONJUCTIVITIS", "VIRAL CONJUNCTIVITIS", "VIRAL WART", "VITREOUS EXUDATES",
  "VITREOUS HEMORRHAGE", "WITHIN NORMAL LIMITS", "XANTHALESMA", "ATONIC SAC", "OLD CRAO", "CRAO", "BRVO"
]

const initialDosages = [
  "1 TIMES A DAY", "1 TIME A DAY FOR ONE WEEK", "2 TIMES A DAY", "2 TIMES A DAY FOR 45 DAYS",
  "2 TIMES A DAY FOR ONE WEEK", "3 TIMES A DAY", "3 TIMES A DAY FOR ONE WEEK", "4 TIMES A DAY",
  "4 TIMES A DAY FOR ONE WEEK", "5 TIMES A DAY", "6 TIMES A DAY", "ALTERNATIVE DAY TO BE CONTINUED",
  "AT NIGHT", "EVERY ONE HOUR", "EVERY 10 MINUTES", "EVERY 2 HOURS"
]

const initialBloodTests = [
  "CBC", "BT", "CT", "PT-INR", "RBS", "FBS", "PP2BS", "HIV", "HBSAG", "HCV", "ANA-PROFILE",
  "P-ANCA", "C-ANCA", "CSR", "CRP", "R.A.FACTOR", "T3 , T4, TSH, ANTI TPO", "S CREATININE", "S. SODIUM LEVELS"
]

const initialComplaints = [
  "Detail", "foreignbody sensation", "dimness of vision", "diplopia", "SUDDEN LOSS OF VISION", "FLASHES OF LIGHT",
  "REDNESS OF EYES", "STIKENESS", "HEADACHE", "ITHCING IN EYES", "BLEPHAROSPASM", "FOREIGN BODY IN EYE",
  "PTOSIS", "Iridocyclitis", "IOP", "I CARE IOP", "Watering", "Pain", "Blurred Vision", "Double Vision",
  "Eye Discharge", "Photophobia", "Eye Strain", "Dry Eyes", "Burning Sensation", "Swelling", "Tearing",
  "Vision Loss", "Floaters", "Light Sensitivity", "Eye Irritation", "Mucus Discharge"
]

const initialDiagnosticTests = [
  "Visual Acuity", "Refraction", "IOP", "Fundoscopy", "OCT", "Visual Field", "Slit Lamp Examination",
  "Gonioscopy", "Pachymetry", "Tonometry", "Perimetry", "Fluorescein Angiography", "Ultrasound B-Scan",
  "Corneal Topography", "Specular Microscopy", "Optical Coherence Tomography", "Fundus Photography"
]

const initialEyeConditions = [
  "Cataract", "Glaucoma", "Retinopathy", "Myopia", "Hypermetropia", "Astigmatism", "Presbyopia",
  "Macular Degeneration", "Diabetic Retinopathy", "Conjunctivitis", "Keratitis", "Uveitis", "Pterygium",
  "Corneal Ulcer", "Retinal Detachment", "Optic Neuritis", "Dry Eye Syndrome"
]

const initialPaymentMethods = ["Cash", "Card", "UPI", "Insurance", "Online", "Cheque", "Net Banking"]

const initialInsuranceProviders = [
  "ICICI", "HDFC", "Star Health", "Max Bupa", "Religare", "Aditya Birla", "TATA AIG", "Care Health",
  "Bajaj Allianz", "New India Assurance", "United India Insurance"
]

const initialVisualAcuity = [
  "6/4P", "6/5P", "6/6P", "6/9P", "6/6", "6/9", "6/12", "6/18", "6/36", "6/60", "FC 1M", "FC 1/2M",
  "FC CLOSE TO FACE", "FC 3M", "HAND MOVEMENTS", "PL+ PR INACURATE", "PL+ PR ACURATE", "6/12P", "6/18P", "6/24P",
  "6/36P", "6/60P", "FIXING", "NO PL", "N/6", "N/8", "N/10", "N/12", "N/18", "N/24"
]

const initialRoutes = ["Oral", "Topical", "IV", "IM", "SC", "Sublingual", "Inhalation", "Rectal"]

const initialEyeSelection = ["Right eye", "Left eye", "Both eye"]

const initialVisitTypes = ["First", "Follow-up-1", "Follow-up-2", "Follow-up-3", "Follow-up-4", "Follow-up-5"]

const initialSacStatus = ["Patent", "Not Patent", "Regurgitant"]

const initialIopRanges = ["10-15 mmHg", "15-20 mmHg", "20-25 mmHg", "> 25 mmHg", "< 10 mmHg"]

const initialLensOptions = [
  "Monofocal IOL", "Multifocal IOL", "Toric IOL", "EDOF IOL", "Phakic IOL",
  "Contact Lens - Soft", "Contact Lens - RGP", "Spectacles", "No Lens"
]

export interface MasterData {
  complaints: string[]
  treatments: string[]
  medicines: string[]
  surgeries: string[]
  diagnosticTests: string[]
  eyeConditions: string[]
  paymentMethods: string[]
  insuranceProviders: string[]
  visualAcuity: string[]
  bloodTests: string[]
  diagnosis: string[]
  dosages: string[]
  routes: string[]
  eyeSelection: string[]
  visitTypes: string[]
  sacStatus: string[]
  iopRanges: string[]
  lensOptions: string[]
}

interface MasterDataContextType {
  masterData: MasterData
  addItem: (category: keyof MasterData, value: string) => void
  deleteItem: (category: keyof MasterData, value: string) => void
  updateMasterData: (category: keyof MasterData, data: string[]) => void
}

const MasterDataContext = React.createContext<MasterDataContextType | undefined>(undefined)

export function MasterDataProvider({ children }: { children: React.ReactNode }) {
  const [masterData, setMasterData] = React.useState<MasterData>({
    complaints: initialComplaints,
    treatments: initialTreatments,
    medicines: initialMedicines,
    surgeries: initialSurgeries,
    diagnosticTests: initialDiagnosticTests,
    eyeConditions: initialEyeConditions,
    paymentMethods: initialPaymentMethods,
    insuranceProviders: initialInsuranceProviders,
    visualAcuity: initialVisualAcuity,
    bloodTests: initialBloodTests,
    diagnosis: initialDiagnosis,
    dosages: initialDosages,
    routes: initialRoutes,
    eyeSelection: initialEyeSelection,
    visitTypes: initialVisitTypes,
    sacStatus: initialSacStatus,
    iopRanges: initialIopRanges,
    lensOptions: initialLensOptions,
  })

  const addItem = React.useCallback((category: keyof MasterData, value: string) => {
    setMasterData(prev => ({
      ...prev,
      [category]: [...prev[category], value]
    }))
  }, [])

  const deleteItem = React.useCallback((category: keyof MasterData, value: string) => {
    setMasterData(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item !== value)
    }))
  }, [])

  const updateMasterData = React.useCallback((category: keyof MasterData, data: string[]) => {
    setMasterData(prev => ({
      ...prev,
      [category]: data
    }))
  }, [])

  const value = React.useMemo(() => ({
    masterData,
    addItem,
    deleteItem,
    updateMasterData
  }), [masterData, addItem, deleteItem, updateMasterData])

  return (
    <MasterDataContext.Provider value={value}>
      {children}
    </MasterDataContext.Provider>
  )
}

export function useMasterData() {
  const context = React.useContext(MasterDataContext)
  if (context === undefined) {
    throw new Error('useMasterData must be used within a MasterDataProvider')
  }
  return context
}
