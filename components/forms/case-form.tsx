"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { useMasterData } from "@/hooks/use-master-data"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { GroupedSearchableSelect, type GroupedOption } from "@/components/ui/grouped-searchable-select"
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select"
import { patientsApi, type Patient } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { PatientSelectorWithHistory } from "@/components/features/patients/patient-selector-with-history"
import { determineVisitType } from "@/lib/utils/visit-type"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, Trash2, X, Save, Pill } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import dynamic from "next/dynamic"

const EyeDrawingTool = dynamic(() => import("@/components/shared/eye-drawing-tool").then(m => m.EyeDrawingTool), { ssr: false })

// Removed hardcoded COMPLAINT_OPTIONS - now using master data API via useMasterData hook

const DIAGNOSIS_OPTIONS = [
  "PANOPHTHALMITIS","ACUTE CONJUNCTIVITS","ACUTE DACRYOCYSTITIS","ADENOVIRUS CONJUNCTIVITIS",
  "AGE RELATED MACULAR DEGENERATION","ALLERGIC CONJUCTIVITIS","ALLERGIC CONJUNCTIVITIS","ALLERGIC OEDEMA",
  "AMBLYOPIA","AMYLOIDOSIS","ANOPHTHALMIC SOCKET","ANTERIOR UVEITIS","ATROPHIC BULBI","AXIAL PROPTOSIS",
  "BACTERIAL CONJUNCTIVITIS","BELL'S PALSY (FACIAL NERVE)","BLEPHARITIS","BLEPHAROPHIMOSIS","BLEPHAROSPASM",
  "BLUNT TRAUMA","BOTH EYE WITHIN NORMAL LIMITS","BROWN CATARACT","CANALICULAR BLOCK","CANALICULITIS",
  "CARUNCULAR CYST","CATARACT IN BOTH EYE","CATARACT IN LEFT EYE","CATARACT IN RIGHT EYE","CELLULITIS","CHALAZION",
  "CHEMOSIS","CHRONIC DACRYOCYSTITIS","CHRONIC PROGRESSIVE EXTERNAL OPHTHALMOPLEGIA","CLEAR","CNVM","CONGENITAL ENTROPION",
  "CONGENITAL NASOLACRIMAL DUCT OBSTRUCTION","CONGENITAL PTOSIS","CONGESTION","CONJUCTIVITIS","CONJUNCTIVAL NEVUS",
  "CONTACT LENS INDUCED KERATITIS","CONVERGENCE INSUFFICIENCY","CORNEAL ABRASIONS","CORNEAL DYSTROPHY","CORNEAL OPACITY",
  "CORNEAL ULCER","CORNEO-SCLERAL TEAR","CSR {MACULA}","DACRYCYSTITIS WITH LACRIMAL SAC ABSCESS","DACRYOADENITIS",
  "DACRYOCYSTITIS","DACRYOPS","DARK CIRCLES","DEEP SOCKET","DERMATOCHALASIS","DRY EYE","EARLY CATARACT","ECTROPION",
  "ENTROPION","EPICANTHUS INVERSUS","EPISCLERITIS","ESSENTIAL BLEPHAROSPASM","EXOPHORIA","EXOTROPIA",
  "EXTRUDED INTUBATION TUBE","EYELID LAXITY","EYELID MASS","EYELID OEDEMA","EYELID RETRACTION","FACIAL NERVE PALSY ? LMN",
  "FAILED DCR","FAT PROLAPSE","FLOATERS","FOREIGNBODY","FRONTAL BOSSING","GLAUCOMA","GLAUCOMA SUSPECT","GLOBE RUPTURE",
  "GRANULOMA","HEADACHE","HEMANGIOMA","HEMIFACIAL SPASM","HIGH MYOPIA","HORDEOLUM-EXTERNAL","HORDEOLUM/STYE",
  "HYPEPIGMENTATION","HYPER MATURE CATARACT","HYPERMETROPIA","HYPOTROPIA","INCLUSION CYST","INTRAORBITAL FOREIGN BODY",
  "LAGOPHTHALMOS","LASERED RETINA","LASIK","LENS CHANGES","LID CYST","LID LACERATION","LID LAXITY","LID MASS","LID OEDEMA",
  "LOWER EYELID MASS","LOWER EYELID SCARRING","LSCD","MACULAR OEDEMA","MATURE CATARACT","MAXILLARY BONE FRACTURE","MIGRAINE",
  "MOLLUSCUM CONTAGIOSUM","MULTIPLE FACIAL FRACTURES","MYOPIA","MYOPIC ASTIGMATISM","NASAL PTERYGIUM","NASOLACRIMAL DUCT OBSTRUCTION",
  "NEUROFIBROMATOSIS NF1","NEVUS","NLD BLOCK","NORMAL","NPDR","NUCLEAR SCL -2","OCULAR MYASTHENIA","OPTIC ATROPHY",
  "ORBITAL CELLULITIS","ORBITAL FLOOR FRACTURE","ORBITAL INJURY","ORBITAL MASS","ORBITAL PSEUDOTUMOUR","ORBITAL RIM FRACTURE",
  "OSSN","PAINFUL BLIND EYE","PANNUS","PANSINUSITIS","PARTIAL BLOCK","PATHOLOGICAL MYOPIA","PCO","PERIORBITAL OEDEMA",
  "PINGECULA","POST DCR","POST LASIK","PPC- POSTERIOR POLAR CATARACT","PRE LASIK WORKUP","PRESBYOPIA","PRESEPTAL CELLULITIS",
  "PSCC","PSEUDOMEMBRANOUS CONJUNCTIVITIS","PSEUDOPHAKIA","PTERYGIUM","PTOSIS","PTOSIS- BOTH EYES","PUNCTAL EVERSION",
  "PUNCTAL STENOSIS","PYOCELE","PYOGENIC GRANULOMA","REFRACTIVE ERROR","RETINAL DETACHMENT","RETINITIS PIGMENTOSA",
  "RIGHT EYE EYELID MASS","RIGHT EYE LID DERMOLIPOMA","ROAD TRAFFIC ACCIDENT","S/P BARRAGE LASER","S/P BLEPHAROPLASTY",
  "S/P CATARACT","S/P CP ANGLE TUMOUR","S/P DCR","S/P ECTROPION","S/P ENTROPION","S/P ENUCLEATION","S/P EXCISION",
  "S/P FRILL EVISCERATION","S/P KERATOPLASTY","S/P LASIK","S/P LATERAL TARSAL STRIP","S/P LID LACERATION REPAIR",
  "S/P LID RECONSTRUCTION","S/P MASS EXCISION","S/P MEDIAL SPINDLE ROTATION","S/P ORBITAL FLOOR FRACTURE REPAIR",
  "S/P ORBITAL FLOOR PLATING","S/P ORBITAL MASS EXCISION","S/P PROBING","S/P PTERYGIUM","S/P PTOSIS SURGERY","S/P PUNCTAL SNIP",
  "S/P SCLERAL SPACER + ECTROPION","S/P SCLERAL TEAR","S/P SICS","S/P SNIP PROCEDURE","S/P SUBPREIOSTEAL ABSCESS DRAINAGE",
  "S/P VR SURGERY","S/P YAG CAPSULOTOMY","SCLERAL TEAR","SEBACEOUS CYST","SENILE ENTROPION","SENILE IMMATURE CATARACT",
  "SENILE PTOSIS","SEVERE DRY EYE","SILICON IMPLANT EXTRUSION","SIMPLE MYOPIA","SLE","STYE","SUB-CONJUNCTIVAL HEMORHAGE",
  "SUB-PERIOSTEAL ABSCESS","TARSAL MASS","TEAR TROUGH DEFECT","THYROID EYE DISEASE","THYROID ORBITOPATHY","TRAUMATIC CATARACT",
  "TRAUMATIC PTOSIS","TRAUMATIC UVEITIS","TRICHIATIC EYELASH","UPPER LID CYST","VERNAL CONJUCTIVITIS","VIRAL CONJUNCTIVITIS",
  "VIRAL WART","VITREOUS EXUDATES","VITREOUS HEMORRHAGE","WITHIN NORMAL LIMITS","XANTHALESMA","ATONIC SAC","OLD CRAO",
  "CRAO","BRVO",
]

// Visual acuity options now loaded from master data (visual_acuity category)

const BLOOD_TEST_OPTIONS = [
  "CBC","BT","CT","PT-INR","RBS","FBS","PP2BS","HIV","HBSAG","HCV","ANA-PROFILE","P-ANCA","C-ANCA",
  "CSR","CRP","R.A.FACTOR","T3 , T4, TSH, ANTI TPO","S CREATININE","S. SODIUM LEVELS"
]

const TREATMENT_OPTIONS = [
  "FOREIGNBODY","GLAUCOMA","ANIRIDIA","COLOBOMA OF IRIS","PTOSIS","BLEPHAROSPASM","CHALAZION","BLEPHARITIS",
  "LENS INDUCED GLAUCOMA","PINGUECULUM","PTERYGIUM","PHLYCTENULAR KERATOCONJUNCTIVITIS","SYMBLEPHARON","MEGALOCORNEA",
  "MICRO CORNEA","KERATOCONUS","CORNEAL ULCER","INTERSTITIAL KERATITIS","RETINO BLASTOMA","ECTOPIA LENTIS",
  "RETINITIS PIGMENTOSA","OPTIC ATROPHY","HORDEOLUM-EXTERNAL","CATARACT IN RIGHT EYE","CATARACT IN LEFT EYE",
  "AMBLYLAOPIA","CORNEAL FOLDS","POOR ENDOTHELIAL COUNT","NLD BLOCK","CATARACT IN BOTH EYE","GLAUCOMMATOUS DAMAGE",
  "CLEAR","Post Subcapsular Cataract","POST POLAR","Cortical Age Related Cataract","NUCLEAR SCL -1","NUCLEAR SCL -2",
  "NUCLEAR SCL -3","NUCLEAR SCL -4","IOL","Mature Cataract  age related","CONJUCTIVITIS","ALLERGIC CONJUCTIVITIS",
  "IRIDOCYCLITIS","SCH","PCO","FILAMENTARY KERATITIS","YAG LASER","STYE","ENDOPHTHALMTIS","SPK","EPITHELIAL DEFECT",
  "THIRD NERVE PALSY","EARLY PCO","HERPES","VIRAL KERETITIES","FUNGAL KERATITIES","SUTURAL CATARACT","CORNEAL SCAR",
  "SEASONAL ALLERGIC","DRY EYE","VERNAL CONJUCTIVITIS","UVETIC GLAUCOMA","EARLY CATARACT","APHAKIA","CORNEAL OPACITY",
  "PXF","CSR {MACULA}","OTPIC NEURITIS","POST HERPETIC SECONDARY GLAUCOMA","MGD","MIGRAINE","DIABETIC","SCLERITIS",
  "HIGH MYOPIA","MICRO SPORIDIAL KERATITIS","BELL'S PALSY (FACIAL NERVE)","DACRYOCYSTITIS","SQUINT EYE","MYOPIA",
  "LR PALSY (SIXTH NERVE)","PSC + NS","ADVICE PHACO SURGERY WITH IOL IMPLANTATION","YAG LASER","LASIK","STYE",
  "ADENOVIRUS CONJUNCTIVITIS","MYATRO EYE DROPS","Diplopia","cortical cataract","PTERYGIUM DONE","PTERYGIUM DONE",
  "Dacrycystitis with Lacrimal Sac Abscess","Income Tax Officer","Flotter in Eyes","YAG LASER DONE","CONCRETION",
  "White Mature Cataract","Early PSC","CORTICAL +PSC","EPISCLERITIS","ALTERNATE EXOTROPIA","PSC+CORTICAL","PBK","PUK",
  "EXOPHORIA","Covid History","CME","Macular Degenration","Barrage Laser Done","Senile Ectropion","MULTIPLE LATTICE",
  "EXOTROPIA","PSEUDOPHAKIA","UPPER LID CYST","EARLY CATARACT","ITCHING","ENTROPION","ECTROPION","Mild NPDR",
  "Diabetic Macular Edema","Post Op CME","Choroidal NEO Vascular Membrane (CNVM)","Advice Intra Vitreal Anti Vegf Inj",
  "Neo Vascular Glaucoma","Advice Right eye PRP Laser","Advice Left eye PRP Laser","Keratitis","psc","Ptosis Scleral",
  "Papilledema","Primary Open Angle Glucoma","Lattice Degeneration","C3R","C3R","SICS","NUCLEAR SCL- 5","C3R DONE",
  "C3R DONE","C3R DONE","Ocular Hypertension","PPC- Posterior Polar Cataract","Flickering of Eyes","Forme Fruste Keratoconus",
  "Advance Keratoconus","S/P Trabeculectomy","Microbial Keratitis - Pseudomonas","Hyper Mature Cataract","Hyper Mature Cataract",
  "Haemorrhage Conjuctivitis","Lattice Degeneration with Holes","S/P YAG Capsulotomy","Intermittent Exotropia",
  "Epidemic Keratoconjunctivitis","Epidemic Keratoconjunctivitis","Retrobulbar Neuritis","Blue Dot Cataract",
  "CCC- Chronic Cicatrizing Conjunctivitis","Macular Retinal Scar","Subluxated IOL","Twitching","Twitching","Hypermetropia",
  "S/P Scleral Buckle","FHI- Fuchs Heretochromic Iridocyclitis","Homonymous Hemianopia","PPCD - Posterior Polymorphous Corneal dystrophy",
  "Positive Dysphotopsia","Viral Conjunctivitis","Choroidal Granuloma","Fuch Distrophy","ADVICE BOTH EYE LASIK SURGERY",
  "PRP Laser","Sixth Nerve palsy","Developmental cataract","Advice Injection IVTA","Advice Injection IVTA Given",
  "Injection IVTA Given","Intra Vitreal Anti Vegf Inj Given","Advice  ICL Surgery","Drry Eye Disease : Aqueous Def > Evaporative",
  "BRAO- Branched Retinal Artery Occl","CATARACT ( PHACOEMULSIFICATION) + IOL","DCR- EXTERNAL","LEFT EYE","RIGHT EYE"
]

const DOSAGE_OPTIONS = [
  "1 TIMES A DAY","1 TIME A DAY FOR ONE WEEK","2 TIMES A DAY","2 TIMES A DAY FOR 45 DAYS","2 TIMES A DAY FOR ONE WEEK",
  "3 TIMES A DAY","3 TIMES A DAY FOR ONE WEEK","4 TIMES A DAY","4 TIMES A DAY FOR ONE WEEK","5 TIMES A DAY","6 TIMES A DAY",
  "ALTERNATIVE DAY TO BE CONTINUED","AT NIGHT","EVERY ONE HOUR","EVERY 10 MINUTES","EVERY 2 HOURS"
]

const MEDICINE_OPTIONS = [
  "ACUPAT EYE DROP","LOTEL LS EYE DROP","Norzen eye drops","Ciplox eye drops","Zoxan eye drops","Cifran eye drops",
  "Diamox Tablet (250 mg)","Betnesol-N Eye drops","Dexament-N Eye Drops","Tropicacyl Plus Eye Drops","Cyclomid Eye Drops",
  "Tropicamet Plus Eye Drops","Atropine Eye Drops","Atropine Eye Ointment","Zofenax Eye Drops","Dicloran Eye Drops",
  "Brufen (200 mg) Tablet","Brufen (400 mg) Tablet","Kinetone Capsule","Nuclav (375 mg) Tablet","Nausidome Tablet",
  "Digene Tablet","Digene Gel","Tablet Deltaflam","Floxigaurd Eye Drops","Pyrimon Eye Drops","Pychlor Eye Drops",
  "Dexament - N Eye Drops","Bleph  Eye Drops","Lacrigel Eye Ointment","Tearplus Eye Drops","Liquiflim Tears","Nudoxy Tablet",
  "Tablet Neurotrat","Osmotek Eye Drops","Moisol Eye Drops","Toba Eye Drops","Genticyin Inj.","Toba - DM Eye Drops",
  "Pilomax  2.0%  Eye Drops","Zoxan Eye Ointment","Ketlur Eye Drops","Vorac Eye Drops","Chlormixin Eye Drops",
  "Chlormixin Eye Ointment","Chlormixin - D Eye Ointment","Timolet Eye Drops 0.5%","Acivir Eye Ointment","Cromal Eye Drops",
  "Ciplox Eye Ointment","Optipress Eye Drops","Optipress - S Eye Drops","Tablet Theragram - M","COMBIGAN EYE DROP",
  "LATACOM","ACUPAT","LOTEL LS","Norzens","Ciplox","Zoxans","Cifrans","Diamox (250 mg)","Betnesol-N","Tropicacyl 1 %",
  "Cyclomids","Tropicamet Pluss","Atropine","Zofenaxs","Diclorans","Brufen (200 mg)","Brufen (400 mg)","Kinetone",
  "Nuclav (375 mg)","Nausidome","Digene","Deltaflam","Floxigaurds","Pyrimons","Pychlors","Dexament - Ns","Bleph s",
  "Lacrigel","Tearpluss","Nudoxy","Neurotrat","Osmoteks","Moisol","Tobas","Genticyin.","TOBA-DM","Pilomax  2.0% s",
  "Zoxan","Ketlurs","Voracs","Chlormixins","Chlormixin","Chlormixin - D","Timolets 0.5%","Acivir","Cromals","Optipresss",
  "Optipress - Ss","Theragram - M","Kenalog - S","Ibugesic(200mg)","Betagan 0.5%s","Scalp Vein Set (No:22)","Glycerol IP",
  "Quinobacts","Ciprodacs","Cadiflurs","Ocupresss","Topcid (20MG)","Zinetac","RANTAC","Odoxil (500MG)","Odoxil (250MG)",
  "Droxyl (250MG)","Crocin","Metacin","Combiflam","Ibugesic Plus","Imol Syrup","Eboo Plus","Vibazine   DT",
  "Dorzox / Brinzagan / Azopt","Dolonex  DT","Flurs","Cortison Kemicetin","Allercroms","Acular-0.5%s","Tropicyl Pluss",
  "Andremides 20 %","Pred Forte/ IO-Pred S","Decol-Ns","Tromacyn s","Cobadex-Z","Bioculas","Phenils","I-Kuls","Vidalyn-M",
  "Kemicetines","Mycidexs","Jonac CRs","Oxigards","Cortisone Kemecitne","Cyclogyl","Atrisolons","TROPINA","Andrecin-P",
  "Adifloxs","CYCLODEX S","KEMICETINE","VIMACAINES","OCUNACS","PARACAINES","SYSCANS","GLUCOMOL 0.5%","TEARS NATURALE II",
  "CIPEYE","COMPLETE STERILE SOLUTION","LIMCE","DECOL - P","ANDRECIN  -PS","TROMADEX","FLUCOMET","INAC-50","IMOL",
  "REDCLOX  KIDS","INAC-TR","INAC-DT","MYCOREST","PRIMAFUCINS","EYEBREXS","REDCLOX","OCUVITS","ZIFERRIN-TRS","LOMIBACTS",
  "LIMCEE","AQUASOL-A","NEUROBION FORTE","OCULONES","JONAC PLUSS","FLUCID-M","NOVIL","INDOFLAM 25 MG","FLOSONES","XALATAN",
  "ALPHAGAN","SUPRADYN","PYCHLOR DEXA","CYCLOGIK 1 %S","I-LUBES","IOTIM 0.5 %","CIPLOX","CONTAZYMES","ANACET-20",
  "DEXOREN-SS","OKACINS","VOVERAN OPHTHAS","PYCHLOR DEXAS","HOT FOMENTATION","EYEVITALS","ALREID","ZYNCET","DUDROPS",
  "OMNACORTIL 10 MG / Wysolone 10mg","COMPLETE ENZYMES","OCUFLURS","LUBRILAC","FEGANS","ZENTILS","Tetracin",
  "Timolet GFS 0.5 %s","Facidaseection","Lomibact 0.3 %s","Toxils","SYMOXYL-LB 250 MG","OPTITHROCIN","I-UBE EYE UNIMS",
  "OCUPOL-DS","FML -T","Azelasts","Hovite Syrup","ZOCONS","Omnacortil (20 Mg) / Wysolone 20mg","TIMOLET PLUSS",
  "OFLOXACINS","TOBDROPS","Iopar-SR","Azithral 250 Mg","OCUPOL","PROPINES","TRIOCYLS","REDCLOX S","OCUCIN","Ocuwets",
  "Scats","Flomexs","Mists","Refresh Tears","SYMOXYL -LB 250 MG","LORMEG","OXYLINS","NATMYET","Pred Mets","CELLUVISC UNIMS",
  "ACTAMIDES","JONAC-PLUS","PREDMETS","LONGACINS","OFLACINS","LATOPROSTS","NEUROBION","EXOCIN","DICULONE","CROMAL FORTS",
  "HYPARSOL-5","PREDACES","PREDFORT / GATIQUIN-P","BRIMOSUN-PS","CYCLOMUNES","MOSS PLUSS","FLAMMER MX","OFELDERS",
  "TEAR DROP","ALBALONS","Moxifresh","FLOGEL","C-MIST","ULTRAFLAM","MOBIZOX","EYEMIST","LUMIGAN","TRAVANTAN","GENTEAL GEL",
  "PENTOLATES","RICHGEL TEARSS","GLUCOMOL ODS","HYPERSOL-6","JUST TEARS","CMPH","WINOLAP","PREDNISOLONES",
  "NEXCARE EYE PATCH","ULTRAGELS","ZADITENS","FLEXON","RELIFS","FLAREX","TIMOLASTS","OCCUMOXS","MYCINS","KETLUR LS",
  "WARM COMPRESSION","MET NEUROBION OD","OCUMOISTS","ACULAR LS","MOXIMUMS","MOXICIP","OFLO","OCUPOL-D","LACRYL PF","ZAHA",
  "LOTEPRED LSS (For 7 Days)","TRAVAXO-T","SYSTANES","NEVANAC","HIFENEC-P","VIGAMOX","TROPICAMET 1%","ESTOCIN",
  "AUGMENTIN DU 625","AMINOGEN","GENTEAL","ATRO","CAREPROST","COLD COMPRESSION","MEGABROMS","APDROPS -LP","NEW BIFLACE",
  "Lacryl Ultra","GATILOXS","MILFLOX","GATIQUINS","R-1500","ZYMAR","KEDS","LOTEL LS ( FOR 7 DAYS ONLY)","TACROZ FORTE",
  "CORTISON OPTICHLOR","LOTEFLAM( FOR 7 DAYS)","KETODROPS LS","AZITHRAL","TEARMAX","OPTIVE","MOXTIF -K","SYSTANE ULTRA",
  "BESIX","VIRSON GEL","LOTERED(FOR 7 DAYS)","AQUASURGE MAX","HIFENEC MR","NEUROBION PLUS","OSMEGAS","T BET","T-1",
  "XOVATRA","ACUVAIL","DOXY-1 L DR FORTE","ALPHAGAN-Z","TRAVACOM","RHYLUB","OPTIVE FUSION","ZYAQUA","OSMODROP","NEPALACT",
  "NEPAFLAM OD","BIDIN LS","REAL TEAR","CPN","CPN PLUS","MEGA CV 625mg","4QUIN DX","TOBA","FMP PLUS","DORZOX-T","DORZOX",
  "MILFLOX DM EYE DROP","COMBIGAN","GANFORT","ALLEGRA 120mg","Rejunex","IOTIM PLUS","FLEXON SYRUP","CONBIFLAM SYRUP",
  "UNIBROM","CETIMET 45mg","PATADAY","VELDROP","EUBRI","PIXELUB MULTI","ALPRAX 0.25 mg","VITCOFOL","4 QUIN LOT",
  "Lotesurge LS","ADOREFLOX-D","CO","CITIMET","LEVOQUIN-500","MANITOL","Harpex","Tab MBSON","Ultracet","AZOPT","ALCAREX",
  "MILFLODEX EYE DROP","MILFODEX","MOSI","Timolet OD","REFRESH LIQUGEL","REFRESH EZZE","ECO TEARS","Microdox-LBX",
  "XALACOM","POLYNASE","LUBREX","IOBRIM","VAIN FLONE (22G)","BIDIN-T","WALYTE CITRO","TOBASTAR","MYTICOM","CHLORODEX",
  "TRAVAXO","L-PRED","ARA GEL","MOSI-DX","LOTEPRED LS","I V SET","BRIMOCOM","NATAMET","HOMIDE","FML","SOFTVISC",
  "B T PRESS","BT PRESS","GLYLENE","BETOACT EYE DROPS","MOXOFT-KTL","MOXIBLU-D","ZYMAR OINTMENT","MOXICIP SINGULES",
  "BRINZAGAN","ARACHITOL-NANO-VIT-D","FLURO","BROMVUE","LOTEMAX","NEUROKIND","NEUROKIND TABLET","OPSION HA","MOXSOFT LP",
  "SIMBRINZA / SYNCA / BRIVEX","UV-LUBE unims","ZYLOPRED","DABFIT","VIGADEXA","ZYMAXID","VISIMOXD EYE DROPS",
  "METHYL PREDNISOLONE","Norma saline 100cc","EMESET","INTRACATH NO -22","Folcer - MP","ZEROFLOX EYE DROP","MILFLOX-DF",
  "AZITHRAL XL SYRUP 200 mg","AQUALUBE","Filamentary Keratitis","BRINZOMA","MIGRANIL TAB","timolast","MYOPIAN","MYOPIN",
  "VALCIVIR-1000","EUGI SACHETS","SOLINE-5","BRIMOTOPOST","I-KUL PLUS","KETOMAR","Moxicip D","LEVOTAS-500","MAXMOIST",
  "CIBRIM - T","MACUGOLD","PILOCAR 2%","APDROP","GATIQUIN","AMPLINAK","SOFINOX","ZIMIVIR 1000mg","AKILOS-P","MOXISURGE",
  "NTGEL","MOXIFORD","ZYWET","MOXITAK","AQUALUBE PM GEL","NUPINASE","TAB. LIMECHEW","TAB. B-LONG (VIT B6 Piyidoxine)",
  "TRAVISIGHT","ZENTIVIN-D","EYEMAC","A-WAYLABLE","DUOBROM","LATOPROST RT","MOISOL-Z","RELUB EYE DROP","MUPINASE CREAM",
  "DAN-MR","REAL GEL EYE DROP","ultra gel","KITMOX-DX","CATAPRED","ZETHROX 100 XL","BIDIN-LS TM","Hysolub Plus",
  "EYE LID CLEANSER","CLEANSER","BIDIN TM","SOFTDROP","SOFT DROP PM GEL","DOLO 650 TAB","LOTEL 0.5","REBACER",
  "MEDI GRIPN (IV)","Milflodex","TACROLIMUS OINTMENT0.3%","Talimus LS","CYCLOSIGN","Limechew (Vit C 500 MG)",
  "TRAVISIGHT T","MOXTIF","Folcer-FE","MB Vit-12","TALIMUS LS","Alaspan AM","Solumedrol 1 gm","MOXOF-D","DAROLAC",
  "TOBA F","MOXITIF EYE DROP","INDOCAP SR (75 MG)","BRINZOX","EXIX","K G Pure (Powder)","L.O.C","FLUCON","DIFLUCOR",
  "MOXISTAR-D","MILFLOX DF","MILFLODEX","Milflodex Eye Drop","L-Pred EYE DROP","fenix eye drops","AQUIM PF","MILCLAVE 625",
  "NEURO KIND","RHYMOXI EYE DROP","KITOMOX EYE DROP","TEAR DROP GEL","RITCH SOLUTION","MOXI-D","K G  PURE","TOVAXO",
  "BRINOLAR","MENITROL","VEN FLOW 22 G","I- SITE PLUS","EAGLE-(I)","MOSI EYE OINNTMENT","POLYCHLOR","POLYCHLOR DM",
  "PANTHEGEL","LATOPROST @RT","MILCLAVE 625mg","CLAVAM 625 mg","DIFLUNET EYE DROP","NEO BROM EYE DROP","HYLA",
  "POILYCHLOR OINT","NEW I SITE","MOXICON LP","ENLUBE FUSION","T-BACT (SKIN OINTMENT)","XLHA EYE DROP","LATOCOM-CF",
  "LACRIMS EYE DROP","LACRIM-S","SPORLAC PLUS","LOT LS 0.2%","APDROPS DM","BRIMOSUN EYE DROPS","apdrops PD",
  "MYSTIC BLUE EYE DROP","In case of Redness and Pain,","IOTIM-B EYE DROP","ULTRA GEL EYE DROP","ARA EYE DROP",
  "BRIMOTAS-T EYE DROP","Oculact","DURONET TM EYE DROP","OFLO EYE OINT","REDIF","FLUOCIN","MOXIMUM-D EYEY DROP",
  "NEPATOP EYE DROP","MYATRO EYE DROP","MFC EYE OINTMENT","IO-TRIM EYE OINTMENT","Locula - TR","UV LUBE","Z-BROM EYEDROPS",
  "OLOPAT EYEDROP","Glylene/ Maxmoist Ultra/ Systane Ultra","OMNACORTIL 40MG / Wysolone 40 mg","BRIMITOL EYE DROP",
  "Cibrim Z","Lumigan / Lowprost PF - Eye Drop","SYNCA","Moistane","UTOB-F (Tobramycin)","MBSON-SL","AUROGEL PLUS",
  "BIMAT LS TM","SOHA EYEDROP","NEPCINAC EYE DROP","HYSOLUB","GLYTEARS","ATROSUN","APIDINE-5","LOTEPRED-T","RIPASUDIL",
  "ILEVRO","LACRYL HYDRATE","Ripatec Eye Drops","FRENIX-NT OCULAR LUBRICANT","GATSUN FORTE","BIMAPIX","BIMAT-LS",
  "ONTEARSUNIT DOSE FOR SINGLE USE","VITREON SACHET (SUNWAYS)","PENVIR 500 mg","PREGABA M 75mg","NUROKIND PLUS",
  "PREDMET 16","PAN D 40","FAMOCID 20","DICLORAN A","DICLORAN","EVAFRESH","HYLOFRESH","ADVANCE TEARS","Cafta","SOLINE-6",
  "NATACIN 5% EYE DROP","FLUCOCID EYE DROP","Gancigel Eye Gel","AD BROM FREE EYE DROP","NepaOnce","GLUCOTIM- LA","ON TEARS",
  "B-LONG TAB VITAMIN B6","Sodamint Tablets BP","LUPITROS-Z","immu-CDZ","GATIQUIN-P","Votalube","Systane Gel",
  "ENMOIST Cream","HEAL TEARS","BRIMOLOL","BRIVEX","FDSON","KITOMOX UNIMUS","EVER FRESH","BTCOM","INTAPROST","TEARPRO",
  "HYPOCLIN EYELASH CLEANSER","HYPE-5","EVERA DS MOISTURISING LOTION","DURSON T","DORSUN-T","Neosporin","DORTAS",
  "FAMOCID 40ng","RICHAGE ULTRA","DORSUN","RESYNC","TALIMUS EYE OINTMENT","LIVOGEN Z","MOSI D","MAXMOIST ULTRA",
  "Neofresh Gel","AZARGA","Gate-P","STORVAS 10MG","HYVET","MOXICIP D","Brimodine","SUPRACAL","Nepaflam","ADD TEARS",
  "AUSCIP-D","Brimocom PF","anxit","Kidtro","Gate - P","RELUB","OPTILAC","LOPERAMIDE 2 mg","AZITHROMYCIN 500mg",
  "VOLINI Spray","BETAFREE","Travatan","MBNET SL","Occucom","masaage","Taximo","TAXIM-O","MFLOTASM","MOXIFAR",
  "ADOREMOXI PD","NEPASTAR OD","MAHAFLOX-LP","CAREPROST LS","TEDIBAR","LOTOP","Everacal Lotion","Vertistar 16 MG",
  "Flexidine","ibuqen","ibugesic","Glycerina Cream","Glycerina Bar","Polychlor","NASOCLEAR NASAL DROP @","Lotestar",
  "Ophthapan Gel","Homacid","Inj. Dexona","Lubimoist","Nipasin","Systane Hydration","Ophthapan","BRIMED- T","CHLOROCOL-H",
  "OPTIVIEW-HA","Albrim - T","Aava","Oflox- D","ZOLINE PLUS","Lotimo","ACIVIR 400 MG","TRAVOPROST","SYMHYLO","HYPERSOL",
  "Lacryl Gentle Gel","MOTOGRAM","MOXITAX LP","VCZ Chewable tablet","lotestar-m","DUO-2  EYE DROP","REFFRON",
  "KIDTRO / MYATRO","Tear/Optive","Moxicip / Mosi","Zaha / Azithral","Milflodex / Moxicip D","LOC Tear Fusion",
  "GANFORT /BIMAT- T /CAREPROST PLUS","POTCHLOR","TRAVATAN / TRAVISIGHT / TRAVAXO","TRAVACOM / TRAVISIGHT-T / TRAVAXO-T",
  "XALATAN / LATOPROST RT / 9.00 PM","XALACOM / LATACOM CF /","AZARGA / BIRNZAGAN  / AZOPT","B T PRESS / ALPHAGAN / BRIMOCOM",
  "SYNCA / DUO-2 / SIMBRINZA","DORSUN -T / DORPRESS-T / DORZOX-T","Systane Gel / Glylene","ECO MOIST","Lubistar 0.5%",
  "Ocupol","VERTISTAR 16 mg","Hysolube / Optive","Cyclotears","BRITE TABLET","L Dio 1","BRIO EYE DROPS","BRIOPT",
  "EYESURGE","MOXISURGE-D","HYLOSURG","PESILONE","Amplinak / Nepcinac","Tablet Macugold / Eyesurge / Reffron",
  "LESIQ PRIME","CMC","OLOPINE","NETALO","NORMO TEARS","FIGHTOX FORTE 625mg","D3 VITA NANO SHOTS","Raricap-L syrup",
  "mulmin syrup","Mosight - LP","Inflow Tears","OTRIVIN NASAL DROP","Optihist Bang","Zeredol SP","Moxitak LP","TakeFresh",
  "Amikacin","Occumox","CETRIZINE","LEMOLATE GOLD","OPTIFRRESH","RESTASIS","HYMOIST","Tregmon","LACORT","LOCORT",
  "MEDIDOL SP","PILOCAR","Amphotyericin","Abpress","AUGMENTIN","Tacrolimus","VOZOLE","AMPHOTERICIN B","Linezalid","BRIO-T",
  "ITRAL EYE","Augmentin","Brinzolast","OPCON A","T-Cycline HC","9:00 PM","NAPLOX","TEARBLAS T","TEARBLAST","Timolol",
  "HYLOTEAR","EN-DOR EYE DROP","TRAVOX","Macushield","POTKLOR","MYESTIN 60mg","MOKSHOT","I-PEG PLUS","TEARSTAY PLUS",
  "NEODEX","DORTAS-T","SYSTANE COMPLETE","CEFIXIME 200mg","ACIVIR 800 MG","Stopach","Ocusoothe Duo","Maqvue","DOLO",
  "Lid massage","Zerodol - SP","LOTESURGE(0.5%)","RAIKI","Careprost / Bimapix","NEXPRO-20","E-FLO","BETADINE","Gloeye",
  "Apidine Plus","NATAFORCE","IO-PRED-S","Alphagan P","Trehatod","Flogel / Maxmoist","Simbrinza","Atorvas 20 mg","Calpol",
  "Ripatec T","Awarene PF","Pixelube/ Tear Drop/ Systane Complete","Lubistar 1%","Lowprost PF","Fortified Ceftazidim",
  "Omnacortil 5 mg","Bromsite","Biflace","HOMOCHEK","inj taxim 1 gm","Moxigram Eye Ointment","CAP. PHEXIN 500",
  "IFLOMAX OINTMENT","ZIFI 200","ULTRACET","PD CURE","MOXICON-CV 625","SERNAC","MOXICON CV 625","MFC","MAXSOUL","TAXIM",
  "METROGYL 500","PHEXIN 500","DEXA 2CC","MAXSOUL-D","SOULFRESH","FLUT-T","AXPERT PLUS","RAWCID-DSR","Aspan 40","MOXICON",
  "AQUIM EYE WIPES","ZEFIX","TOBRINE EYE DROP","COMBIPAAR","DEXIMON-PX","CLAVUM 625","NEXTANE EYE WIPES","AQUIM GEL",
  "EYECIRQUE PRO","LEVOCET 5 mg","CHLODEX P","LEVOCET-M Syrup","LEVOCET-M","GENFOUR-DX","ENMOX","Naproxen",
  "RETICHLOR H EYE OINTMENT","Fortified Voriconazole 1%","Fortified Ceftazidime 50 mg/ml","fortified Vancomycin 5%",
  "LOTEPRED EYE DROPS","MEGABROM EYE DROPS","AP EASE","METHYLPREDNISOLONE 1 gm","MEDERMA SCAR CREAM","Tobracid F",
  "Fresheyes Tears","ECOTEARS HA","MOXIGRAM","MOXIGRAM EYE DROPS","GENFOUR-LP","CELIN 500","I SITE PLUS",
  "FLUTICASONE NASAL SPRAY","THIO-ACE","DYNAPAR-QPS SPRAY","DRY SHAMPOO","OTRIVIN PEDIATRIC NASAL SPRAY","BRESOL SYRUP",
  "RESWAS","CONTRACTUBEX  OINTMENT","ENTOD LASH FACTOR","BIOHOMIN TABLET","TERZO SP",
  "IV INJECTION METHYL PREDNISOLONE 500mg","moxigram-lx","ZIVIMOX","ELMOX CV 625 DUO","CATAGON EYE DROPS","EYEMIST FORTE",
  "NAPRA-D","MOFO DX","SOFI RX ULTRA","5-FLUROURACIL 1%","VOTAMOX-D","GATILOX-DM","GENFOUR EYE DROPS","NEPRA- D",
  "METHYLPREDNISOLONE 500mg","MAXIM EYE DROPS","MOVEXX-SP","LOTEPRED 1% EYE DROPS","RAYPOL","BOTRACLOT SOLUTION","ABGEL",
  "3M MICROPORE","VOTAMOX-LP","MOXAM","CLEARVIEW EYE DROPS","SOHA LIQUIGEL","SHELCAL","AQUIM T","PREDFORTE",
  "ENTEROGERMINA SOLUTION","OMEGA 500 CAPSULE","I KUL EYE DROPS","AP REST PLUS","SHELCAL-M","MAXIM L","4 LUB HA Eye drops",
  "CHLORONIX EYE OINTMENT","MOXIGRAM D","CHLOMAX P"
]

const SURGERY_OPTIONS = [
  "FOREIGNBODY","GLAUCOMA","ANIRIDIA","COLOBOMA OF IRIS","PTOSIS","BLEPHAROSPASM","CHALAZION","BLEPHARITIS",
  "LENS INDUCED GLAUCOMA","PINGUECULUM","PTERYGIUM","PHLYCTENULAR KERATOCONJUNCTIVITIS","SYMBLEPHARON","MEGALOCORNEA",
  "MICRO CORNEA","KERATOCONUS","CORNEAL ULCER","INTERSTITIAL KERATITIS","RETINO BLASTOMA","ECTOPIA LENTIS",
  "RETINITIS PIGMENTOSA","OPTIC ATROPHY","HORDEOLUM-EXTERNAL","CATARACT IN RIGHT EYE","CATARACT IN LEFT EYE",
  "AMBLYLAOPIA","CORNEAL FOLDS","POOR ENDOTHELIAL COUNT","NLD BLOCK","CATARACT IN BOTH EYE","GLAUCOMMATOUS DAMAGE",
  "CLEAR","Post Subcapsular Cataract","POST POLAR","Cortical Age Related Cataract","NUCLEAR SCL -1","NUCLEAR SCL -2",
  "NUCLEAR SCL -3","NUCLEAR SCL -4","IOL","Mature Cataract  age related","CONJUCTIVITIS","ALLERGIC CONJUCTIVITIS",
  "IRIDOCYCLITIS","SCH","PCO","FILAMENTARY KERATITIS","YAG LASER","STYE","ENDOPHTHALMTIS","SPK","EPITHELIAL DEFECT",
  "THIRD NERVE PALSY","EARLY PCO","HERPES","VIRAL KERETITIES","FUNGAL KERATITIES","SUTURAL CATARACT","CORNEAL SCAR",
  "SEASONAL ALLERGIC","DRY EYE","VERNAL CONJUCTIVITIS","UVETIC GLAUCOMA","EARLY CATARACT","APHAKIA","CORNEAL OPACITY",
  "PXF","CSR {MACULA}","OTPIC NEURITIS","POST HERPETIC SECONDARY GLAUCOMA","MGD","MIGRAINE","DIABETIC","SCLERITIS",
  "HIGH MYOPIA","MICRO SPORIDIAL KERATITIS","BELL'S PALSY (FACIAL NERVE)","DACRYOCYSTITIS","SQUINT EYE","MYOPIA",
  "LR PALSY (SIXTH NERVE)","PSC + NS","ADVICE PHACO SURGERY WITH IOL IMPLANTATION","LASIK","ADENOVIRUS CONJUNCTIVITIS",
  "MYATRO EYE DROPS","Diplopia","cortical cataract","PTERYGIUM DONE","Dacrycystitis with Lacrimal Sac Abscess",
  "Flotter in Eyes","YAG LASER DONE","CONCRETION","White Mature Cataract","Early PSC","CORTICAL +PSC","EPISCLERITIS",
  "ALTERNATE EXOTROPIA","PSC+CORTICAL","PBK","PUK","EXOPHORIA","Covid History","CME","Macular Degenration",
  "Barrage Laser Done","Senile Ectropion","MULTIPLE LATTICE","EXOTROPIA","PSEUDOPHAKIA","UPPER LID CYST","ITCHING",
  "ENTROPION","ECTROPION","Mild NPDR","Diabetic Macular Edema","Post Op CME","Choroidal NEO Vascular Membrane (CNVM)",
  "Advice Intra Vitreal Anti Vegf Inj","Neo Vascular Glaucoma","Advice Right eye PRP Laser","Advice Left eye PRP Laser",
  "Keratitis","psc","Ptosis Scleral","Papilledema","Primary Open Angle Glucoma","Lattice Degeneration","C3R","SICS",
  "NUCLEAR SCL- 5","C3R DONE","Ocular Hypertension","PPC- Posterior Polar Cataract","Flickering of Eyes",
  "Forme Fruste Keratoconus","Advance Keratoconus","S/P Trabeculectomy","Microbial Keratitis - Pseudomonas",
  "Hyper Mature Cataract","Haemorrhage Conjuctivitis","Lattice Degeneration with Holes","S/P YAG Capsulotomy",
  "Intermittent Exotropia","Epidemic Keratoconjunctivitis","Retrobulbar Neuritis","Blue Dot Cataract",
  "CCC- Chronic Cicatrizing Conjunctivitis","Macular Retinal Scar","Subluxated IOL","Twitching","Hypermetropia",
  "S/P Scleral Buckle","FHI- Fuchs Heretochromic Iridocyclitis","Homonymous Hemianopia",
  "PPCD - Posterior Polymorphous Corneal dystrophy","Positive Dysphotopsia","Viral Conjunctivitis","Choroidal Granuloma",
  "Fuch Distrophy","ADVICE BOTH EYE LASIK SURGERY","PRP Laser","Sixth Nerve palsy","Developmental cataract",
  "Advice Injection IVTA","Advice Injection IVTA Given","Injection IVTA Given","Intra Vitreal Anti Vegf Inj Given",
  "Advice  ICL Surgery","Drry Eye Disease : Aqueous Def > Evaporative","BRAO- Branched Retinal Artery Occl"
]

const caseFormSchema = z.object({
  // 1. Register
  case_no: z.string().min(1, "Case number is required"),
  case_date: z.string().min(1, "Date is required"),
  patient_id: z.string().min(1, "Patient is required"),
  visit_type: z.string().min(1, "Visit type is required"),
  
  // 2. Case History
  chief_complaint: z.string().optional(),
  history_present_illness: z.string().optional(),
  
  // 3. Treatments & Medications (Past History)
  past_history_treatments: z.array(z.object({
    treatment: z.string(),
    years: z.string(),
  })).optional(),
  past_history_medicines: z.array(z.object({
    medicine_id: z.string().optional(),
    medicine_name: z.string(),
    type: z.string().optional(),
    advice: z.string().optional(),
    duration: z.string().optional(),
    eye: z.string().optional(),
  })).optional(),
  
  // 4. Complaints
  complaints: z.array(z.object({
    categoryId: z.string().nullable().optional(),
    complaintId: z.string().min(1, "Complaint is required"),
    eye: z.string().optional(),
    duration: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
  
  // 5. Vision & Refraction - Vision
  visual_acuity_unaided_right: z.string().optional(),
  visual_acuity_unaided_left: z.string().optional(),
  pinhole_right: z.string().optional(),
  pinhole_left: z.string().optional(),
  visual_acuity_aided_right: z.string().optional(),
  visual_acuity_aided_left: z.string().optional(),
  near_visual_right: z.string().optional(),
  near_visual_left: z.string().optional(),
  
  // 5. Vision & Refraction - Refraction
  refraction_distant_sph_right: z.string().optional(),
  refraction_distant_cyl_right: z.string().optional(),
  refraction_distant_axis_right: z.string().optional(),
  refraction_distant_va_right: z.string().optional(),
  refraction_distant_sph_left: z.string().optional(),
  refraction_distant_cyl_left: z.string().optional(),
  refraction_distant_axis_left: z.string().optional(),
  refraction_distant_va_left: z.string().optional(),
  
  refraction_near_sph_right: z.string().optional(),
  refraction_near_cyl_right: z.string().optional(),
  refraction_near_axis_right: z.string().optional(),
  refraction_near_va_right: z.string().optional(),
  refraction_near_sph_left: z.string().optional(),
  refraction_near_cyl_left: z.string().optional(),
  refraction_near_axis_left: z.string().optional(),
  refraction_near_va_left: z.string().optional(),
  
  refraction_pg_sph_right: z.string().optional(),
  refraction_pg_cyl_right: z.string().optional(),
  refraction_pg_axis_right: z.string().optional(),
  refraction_pg_va_right: z.string().optional(),
  refraction_pg_sph_left: z.string().optional(),
  refraction_pg_cyl_left: z.string().optional(),
  refraction_pg_axis_left: z.string().optional(),
  refraction_pg_va_left: z.string().optional(),
  
  refraction_purpose: z.string().optional(),
  refraction_quality: z.string().optional(),
  refraction_remark: z.string().optional(),
  
  // 6. Examination - Anterior Segment
  eyelids_right: z.string().optional(),
  eyelids_left: z.string().optional(),
  conjunctiva_right: z.string().optional(),
  conjunctiva_left: z.string().optional(),
  cornea_right: z.string().optional(),
  cornea_left: z.string().optional(),
  anterior_chamber_right: z.string().optional(),
  anterior_chamber_left: z.string().optional(),
  iris_right: z.string().optional(),
  iris_left: z.string().optional(),
  lens_right: z.string().optional(),
  lens_left: z.string().optional(),
  anterior_remarks: z.string().optional(),
  
  // 6. Examination - Posterior Segment
  vitreous_right: z.string().optional(),
  vitreous_left: z.string().optional(),
  disc_right: z.string().optional(),
  disc_left: z.string().optional(),
  retina_right: z.string().optional(),
  retina_left: z.string().optional(),
  posterior_remarks: z.string().optional(),
  
  // 7. Blood Investigation
  blood_pressure: z.string().optional(),
  blood_sugar: z.string().optional(),
  blood_tests: z.array(z.string()).optional(),
  
  // 8. Diagnosis
  diagnosis: z.array(z.string()).optional(),
  no_complaints_flag: z.boolean().optional(),
  diagnosis_pending_flag: z.boolean().optional(),
  
  // 9. Diagnostic Tests
  iop_right: z.string().optional(),
  iop_left: z.string().optional(),
  sac_test_right: z.string().optional(),
  sac_test_left: z.string().optional(),
  diagnostic_tests: z.array(z.object({
    test_id: z.string().min(1, "Test is required"),
    eye: z.string().optional(),
    type: z.string().optional(),
    problem: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
  
  // 10. Advice
  medicines: z.array(z.object({
    drug_name: z.string(),
    eye: z.string(),
    dosage: z.string(),
    route: z.string(),
    duration: z.string(),
    quantity: z.string(),
  })).optional(),
  surgeries: z.array(z.object({
    eye: z.string(),
    surgery_name: z.string(),
    anesthesia: z.string(),
  })).optional(),
  dosage: z.string().optional(),
  surgery_advised: z.string().optional(),
  treatments: z.array(z.string()).optional(),
  // 11. Diagram
  right_eye_diagram: z.string().optional(),
  left_eye_diagram: z.string().optional(),
  // 12. Advice
  advice_remarks: z.string().optional(),
  surgery_remarks: z.string().optional(),
})

interface CaseFormProps {
  children: React.ReactNode
  caseData?: any
  mode?: "add" | "edit"
  onSubmit?: (data: any) => void
}

export function CaseForm({ children, caseData, mode = "add", onSubmit: onSubmitCallback }: CaseFormProps) {
  const [open, setOpen] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState("register")
  const [completedSteps, setCompletedSteps] = React.useState<Set<string>>(new Set())
  const [visitedSteps, setVisitedSteps] = React.useState<Set<string>>(new Set())
  const [patients, setPatients] = React.useState<SearchableSelectOption[]>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { toast } = useToast()

  // State for complaint form inputs
  const [newComplaintId, setNewComplaintId] = React.useState("")
  const [newComplaintCategoryId, setNewComplaintCategoryId] = React.useState<string | null>(null)
  const [newComplaintEye, setNewComplaintEye] = React.useState("")
  const [newComplaintDuration, setNewComplaintDuration] = React.useState("")
  const [newComplaintNotes, setNewComplaintNotes] = React.useState("")
  const [complaintGroups, setComplaintGroups] = React.useState<GroupedOption[]>([])

  // State for medicine form inputs
  const [newMedicineDrug, setNewMedicineDrug] = React.useState("")
  const [newMedicineEye, setNewMedicineEye] = React.useState("")
  const [newMedicineDosage, setNewMedicineDosage] = React.useState("")
  const [newMedicineRoute, setNewMedicineRoute] = React.useState("")
  const [newMedicineDuration, setNewMedicineDuration] = React.useState("")
  const [newMedicineQuantity, setNewMedicineQuantity] = React.useState("")
  const [showAddMedicineDialog, setShowAddMedicineDialog] = React.useState(false)
  const [newMedicineName, setNewMedicineName] = React.useState("")
  const [newMedicineDescription, setNewMedicineDescription] = React.useState("")
  const [showMedicineForm, setShowMedicineForm] = React.useState(false)
  const [showInlineTreatmentForm, setShowInlineTreatmentForm] = React.useState(false)
  const [newTreatment, setNewTreatment] = React.useState("")
  const [newTreatmentYears, setNewTreatmentYears] = React.useState("")
  const [showInlineMedicineForm, setShowInlineMedicineForm] = React.useState(false)
  const [newPastMedicineName, setNewPastMedicineName] = React.useState("")
  const [newPastMedicineType, setNewPastMedicineType] = React.useState("")
  const [newPastMedicineDuration, setNewPastMedicineDuration] = React.useState("")
  const [newPastMedicineEye, setNewPastMedicineEye] = React.useState("R")

  // State for surgery form inputs
  const [newSurgeryEye, setNewSurgeryEye] = React.useState("")
  const [newSurgeryName, setNewSurgeryName] = React.useState("")
  const [newSurgeryAnesthesia, setNewSurgeryAnesthesia] = React.useState("")
  const [showSurgeryForm, setShowSurgeryForm] = React.useState(false)

  // State for diagnostic test form inputs
  const [newTestId, setNewTestId] = React.useState("")
  const [newTestEye, setNewTestEye] = React.useState("")
  const [newTestType, setNewTestType] = React.useState("")
  const [newTestProblem, setNewTestProblem] = React.useState("")
  const [newTestNotes, setNewTestNotes] = React.useState("")
  const [showComplaintForm, setShowComplaintForm] = React.useState(false)

  const masterData = useMasterData()

  // Initialize form BEFORE any code that references it
  const form = useForm<z.infer<typeof caseFormSchema>>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: caseData || {
        case_no: `OPT${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        case_date: new Date().toISOString().split("T")[0],
        patient_id: "",
      visit_type: "First",
        complaints: [],
        diagnosis: [],
        no_complaints_flag: false,
        diagnosis_pending_flag: false,
        blood_tests: [],
        treatments: [],
        right_eye_diagram: "",
        left_eye_diagram: "",
        surgery_remarks: "",
        sac_test_right: "",
        sac_test_left: "",
    },
  })

  // Field arrays for patient history sections
  const { fields: treatmentFields, append: appendTreatment, remove: removeTreatment } = useFieldArray({
    control: form.control,
    name: "past_history_treatments",
  })

  const { fields: medicineFields, append: appendPastMedicine, remove: removePastMedicine } = useFieldArray({
    control: form.control,
    name: "past_history_medicines",
  })

  const { fields: complaintFields, append: appendComplaint, remove: removeComplaint } = useFieldArray({
    control: form.control,
    name: "complaints",
  })

  const { fields: medicineAdviceFields, append: appendMedicine, remove: removeMedicine } = useFieldArray({
    control: form.control,
    name: "medicines",
  })

  const { fields: surgeryFields, append: appendSurgery, remove: removeSurgery } = useFieldArray({
    control: form.control,
    name: "surgeries",
  })

  const { fields: diagnosticTestFields, append: appendDiagnosticTest, remove: removeDiagnosticTest } = useFieldArray({
    control: form.control,
    name: "diagnostic_tests",
  })

  // Compute visit type options for the dropdown
  const visitTypeOptions = React.useMemo(() => {
    if (!masterData.data.visitTypes || masterData.data.visitTypes.length === 0) {
      return []
    }
    return masterData.data.visitTypes.map(option => ({
      value: option.label, // Use the actual name as value
      label: option.label  // Display the same name
    }))
  }, [masterData.data.visitTypes])

  // Reset form and clear patient when dialog opens (for add mode)
  React.useEffect(() => {
    if (open && mode === "add") {
      // Reset form with fresh default values
      form.reset({
        case_no: `OPT${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        case_date: new Date().toISOString().split("T")[0],
        patient_id: "",
        visit_type: "First",
        complaints: [],
        diagnosis: [],
        no_complaints_flag: false,
        diagnosis_pending_flag: false,
        blood_tests: [],
        treatments: [],
        right_eye_diagram: "",
        left_eye_diagram: "",
        sac_test_right: "",
        sac_test_left: "",
      })
      // Clear selected patient
      setSelectedPatient(null)
      // Reset to first step
      setCurrentStep("register")
    }
  }, [open, mode, form])

  // Reset form with caseData when dialog opens in edit mode
  React.useEffect(() => {
    if (open && mode === "edit" && caseData) {
      const visionData = caseData.vision_data || {}
      const examinationData = caseData.examination_data || {}
      const bloodInvestigation = examinationData.blood_investigation || {}
      
      // Map API response fields to form fields
      const formData: any = {
        // Basic info
        case_no: caseData.case_no || "",
        case_date: caseData.case_date || (caseData.encounter_date ? new Date(caseData.encounter_date).toISOString().split("T")[0] : ""),
        patient_id: caseData.patient_id || "",
        visit_type: caseData.visit_type || "First",
        
        // Case History
        chief_complaint: caseData.chief_complaint || "",
        history_present_illness: caseData.history_of_present_illness || caseData.history || "",
        
        // Past History
        past_history_treatments: caseData.past_history_treatments || [],
        past_history_medicines: caseData.past_history_medicines || caseData.past_medications || [],
        
        // Complaints
        complaints: caseData.complaints || [],
        no_complaints_flag: caseData.complaints?.length === 0 || false,
        
        // Vision Data
        visual_acuity_unaided_right: visionData.unaided?.right || "",
        visual_acuity_unaided_left: visionData.unaided?.left || "",
        pinhole_right: visionData.pinhole?.right || "",
        pinhole_left: visionData.pinhole?.left || "",
        visual_acuity_aided_right: visionData.aided?.right || "",
        visual_acuity_aided_left: visionData.aided?.left || "",
        near_visual_right: visionData.near?.right || "",
        near_visual_left: visionData.near?.left || "",
        
        // Refraction Data
        refraction_distant_sph_right: examinationData.refraction?.distant?.right?.sph || "",
        refraction_distant_cyl_right: examinationData.refraction?.distant?.right?.cyl || "",
        refraction_distant_axis_right: examinationData.refraction?.distant?.right?.axis || "",
        refraction_distant_va_right: examinationData.refraction?.distant?.right?.va || "",
        refraction_distant_sph_left: examinationData.refraction?.distant?.left?.sph || "",
        refraction_distant_cyl_left: examinationData.refraction?.distant?.left?.cyl || "",
        refraction_distant_axis_left: examinationData.refraction?.distant?.left?.axis || "",
        refraction_distant_va_left: examinationData.refraction?.distant?.left?.va || "",
        refraction_near_sph_right: examinationData.refraction?.near?.right?.sph || "",
        refraction_near_cyl_right: examinationData.refraction?.near?.right?.cyl || "",
        refraction_near_axis_right: examinationData.refraction?.near?.right?.axis || "",
        refraction_near_va_right: examinationData.refraction?.near?.right?.va || "",
        refraction_near_sph_left: examinationData.refraction?.near?.left?.sph || "",
        refraction_near_cyl_left: examinationData.refraction?.near?.left?.cyl || "",
        refraction_near_axis_left: examinationData.refraction?.near?.left?.axis || "",
        refraction_near_va_left: examinationData.refraction?.near?.left?.va || "",
        refraction_pg_sph_right: examinationData.refraction?.pg?.right?.sph || "",
        refraction_pg_cyl_right: examinationData.refraction?.pg?.right?.cyl || "",
        refraction_pg_axis_right: examinationData.refraction?.pg?.right?.axis || "",
        refraction_pg_va_right: examinationData.refraction?.pg?.right?.va || "",
        refraction_pg_sph_left: examinationData.refraction?.pg?.left?.sph || "",
        refraction_pg_cyl_left: examinationData.refraction?.pg?.left?.cyl || "",
        refraction_pg_axis_left: examinationData.refraction?.pg?.left?.axis || "",
        refraction_pg_va_left: examinationData.refraction?.pg?.left?.va || "",
        refraction_purpose: examinationData.refraction?.purpose || "",
        refraction_quality: examinationData.refraction?.quality || "",
        refraction_remark: examinationData.refraction?.remark || "",
        
        // Anterior Segment
        eyelids_right: examinationData.anterior_segment?.eyelids?.right || "",
        eyelids_left: examinationData.anterior_segment?.eyelids?.left || "",
        conjunctiva_right: examinationData.anterior_segment?.conjunctiva?.right || "",
        conjunctiva_left: examinationData.anterior_segment?.conjunctiva?.left || "",
        cornea_right: examinationData.anterior_segment?.cornea?.right || "",
        cornea_left: examinationData.anterior_segment?.cornea?.left || "",
        anterior_chamber_right: examinationData.anterior_segment?.anterior_chamber?.right || "",
        anterior_chamber_left: examinationData.anterior_segment?.anterior_chamber?.left || "",
        iris_right: examinationData.anterior_segment?.iris?.right || "",
        iris_left: examinationData.anterior_segment?.iris?.left || "",
        lens_right: examinationData.anterior_segment?.lens?.right || "",
        lens_left: examinationData.anterior_segment?.lens?.left || "",
        anterior_remarks: examinationData.anterior_segment?.remarks || "",
        
        // Posterior Segment
        vitreous_right: examinationData.posterior_segment?.vitreous?.right || "",
        vitreous_left: examinationData.posterior_segment?.vitreous?.left || "",
        disc_right: examinationData.posterior_segment?.disc?.right || "",
        disc_left: examinationData.posterior_segment?.disc?.left || "",
        retina_right: examinationData.posterior_segment?.retina?.right || "",
        retina_left: examinationData.posterior_segment?.retina?.left || "",
        posterior_remarks: examinationData.posterior_segment?.remarks || "",
        
        // Blood Investigation
        blood_pressure: bloodInvestigation.blood_pressure || "",
        blood_sugar: bloodInvestigation.blood_sugar || "",
        blood_tests: bloodInvestigation.blood_tests || caseData.blood_tests || [],
        
        // Diagnosis
        diagnosis: Array.isArray(caseData.diagnosis) ? caseData.diagnosis : (caseData.diagnosis ? [caseData.diagnosis] : []),
        diagnosis_pending_flag: !caseData.diagnosis || (Array.isArray(caseData.diagnosis) && caseData.diagnosis.length === 0) || false,
        
        // Diagnostic Tests
        iop_right: examinationData.tests?.iop?.right?.id || caseData.iop_right || "",
        iop_left: examinationData.tests?.iop?.left?.id || caseData.iop_left || "",
        sac_test_right: examinationData.tests?.sac_test?.right || caseData.sac_test_right || "",
        sac_test_left: examinationData.tests?.sac_test?.left || caseData.sac_test_left || "",
        diagnostic_tests: caseData.diagnostic_tests || [],
        
        // Medicines (will be set separately via the existing useEffect)
        medicines: [],
        
        // Surgeries
        surgeries: examinationData.surgeries || [],
        
        // Diagrams
        right_eye_diagram: examinationData.diagrams?.right || "",
        left_eye_diagram: examinationData.diagrams?.left || "",
        
        // Advice
        advice_remarks: caseData.advice_remarks || caseData.follow_up_instructions || "",
        surgery_remarks: caseData.surgery_remarks || "",
      }
      
      // Reset form with mapped data
      form.reset(formData)
      
      // Set selected patient if patient_id exists
      if (caseData.patient_id) {
        // Fetch full patient data
        patientsApi.getById(caseData.patient_id).then(response => {
          if (response.success && response.data) {
            setSelectedPatient(response.data)
          }
        }).catch(() => {
          // Silently fail if patient fetch fails
        })
      }
    }
  }, [open, mode, caseData, form, patients])

  // Load master data when dialog opens
  React.useEffect(() => {
    if (open) {
      // Fetch all required master data categories for dropdowns
      masterData.fetchMultiple([
        'treatments', 
        'medicines', 
        'dosages', 
        'routes', 
        'eyeSelection',
        'visitTypes', 
        'surgeries', 
        'diagnosis', 
        'sacStatus', 
        'iopRanges',
        'iopMethods',
        'visualAcuity',
        'bloodTests',
        'diagnosticTests',
        'anesthesiaTypes'
      ])
      
      // Fetch hierarchical complaints separately
      fetchComplaintGroups()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Fetch hierarchical complaint groups
  const fetchComplaintGroups = async () => {
    try {
      const response = await fetch('/api/master-data?category=complaints&active_only=true')
      const result = await response.json()
      if (result.success && result.hierarchical && result.data) {
        setComplaintGroups(result.data)
      }
    } catch (error) {
      console.error('Error fetching complaint groups:', error)
      toast({
        title: 'Error',
        description: 'Failed to load complaint categories',
        variant: 'destructive'
      })
    }
  }

  // Load patients when dialog opens
  React.useEffect(() => {
    const loadPatients = async () => {
      if (!open) return
      setLoadingPatients(true)
      try {
        const response = await patientsApi.list({ limit: 1000, status: 'active' })
        if (response.success && response.data) {
          setPatients(
            response.data.map((patient) => ({
              value: patient.id,
              label: `${patient.full_name} (${patient.patient_id})`,
            }))
          )
        }
      } catch (error) {
        console.error("Error loading patients:", error)
        toast({
          title: "Failed to load patients",
          description: "Please try again",
          variant: "destructive",
        })
      } finally {
        setLoadingPatients(false)
      }
    }
    loadPatients()
  }, [open, toast])

  // Auto-detect visit type when patient is selected
  React.useEffect(() => {
    if (selectedPatient) {
      determineVisitType(selectedPatient.id).then(visitType => {
        form.setValue('visit_type', visitType)
        toast({
          title: "Visit Type Detected",
          description: `This is a ${visitType} visit for ${selectedPatient.full_name}`,
        })
      })
    }
  }, [selectedPatient, form, toast])

  // Update form when patient is selected
  const handlePatientSelect = (patient: Patient | null) => {
    setSelectedPatient(patient)
    if (patient) {
      form.setValue('patient_id', patient.id)
    } else {
      form.setValue('patient_id', '')
    }
  }

  function SimpleCombobox({
    options,
    value,
    onChange,
    placeholder,
    className,
  }: {
    options: SearchableSelectOption[]
    value?: string
    onChange: (v: string) => void
    placeholder?: string
    className?: string
  }) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")
    const [isTyping, setIsTyping] = React.useState(false)
    
    // Find selected option by value (UUID)
    const selectedOption = options.find(opt => opt.value === value)
    const displayValue = selectedOption?.label || ""
    
    React.useEffect(() => {
      if (!isTyping) {
        setInputValue(displayValue)
      }
    }, [displayValue, isTyping])

    // debounce
    const [debounced, setDebounced] = React.useState(inputValue)
    React.useEffect(() => {
      const t = setTimeout(() => setDebounced(inputValue), 150)
      return () => clearTimeout(t)
    }, [inputValue])

    const filtered = React.useMemo(() => {
      // Guard against undefined options
      if (!options || !Array.isArray(options)) return []
      // If user just opened and hasn't typed, show all
      if (!isTyping && open) return options
      const q = (debounced || "").trim().toLowerCase()
      if (!q) return options
      return options.filter((o) => o.label.toLowerCase().includes(q))
    }, [options, debounced, isTyping, open])

    const [active, setActive] = React.useState(0)
    React.useEffect(() => {
      setActive(0)
    }, [debounced, open])

    const handleSelect = (opt: SearchableSelectOption) => {
      onChange(opt.value)
      setInputValue(opt.label)
      setIsTyping(false)
      setOpen(false)
    }

    const handleClear = () => {
      onChange("")
      setInputValue("")
      setIsTyping(false)
      setOpen(false)
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className={`w-full justify-between text-left font-normal ${!value && 'text-muted-foreground'} ${className || 'border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm'}`}
          >
            <span className="truncate">{displayValue || placeholder || "Select option"}</span>
            <span className="ml-2">▼</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] z-[100]" align="start" sideOffset={4}>
          <div className="p-2 border-b">
            <Input
              placeholder="Search..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setIsTyping(true)
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActive((p) => Math.min(p + 1, Math.max(filtered.length - 1, 0)))
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActive((p) => Math.max(p - 1, 0))
                } else if (e.key === 'Enter') {
                  if (filtered[active]) {
                    e.preventDefault()
                    handleSelect(filtered[active])
                  }
                } else if (e.key === 'Escape') {
                  setOpen(false)
                }
              }}
              className="h-8 border-gray-300 focus-visible:ring-gray-300 bg-white text-foreground"
              autoComplete="off"
              autoFocus
            />
          </div>
          <ScrollArea className="max-h-60 bg-white">
            {value ? (
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-gray-100 border-b"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClear}
              >
                ✕ Clear selection
              </button>
            ) : null}
            {filtered.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">No results</div>
            ) : (
              filtered.map((opt, idx) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                    opt.value === value || idx === active ? 'bg-gray-100' : ''
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => handleSelect(opt)}
                >
                  {opt.label}
                </button>
              ))
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    )
  }

  function TagMultiSelect({
    options,
    values,
    onChange,
    placeholder,
  }: {
    options: SearchableSelectOption[]
    values?: string[]
    onChange: (v: string[]) => void
    placeholder?: string
  }) {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [debounced, setDebounced] = React.useState(query)
    React.useEffect(() => {
      const t = setTimeout(() => setDebounced(query), 150)
      return () => clearTimeout(t)
    }, [query])
    const filtered = React.useMemo(() => {
      // Guard against undefined options
      if (!options || !Array.isArray(options)) return []
      const q = debounced.trim().toLowerCase()
      if (!q) return options
      return options.filter((o) => o.label.toLowerCase().includes(q))
    }, [options, debounced])
    const [active, setActive] = React.useState(0)
    React.useEffect(() => setActive(0), [debounced])
    
    // Get labels for display
    const selectedOptions = (values || []).map(val => 
      options.find(opt => opt.value === val)
    ).filter(Boolean) as SearchableSelectOption[]

    const remove = (itemValue: string) => {
      onChange((values || []).filter((v) => v !== itemValue))
    }

    return (
      <div className="space-y-2 relative">
        <div className="flex flex-wrap gap-2">
          {selectedOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items selected</p>
          ) : null}
          {selectedOptions.map((opt) => (
            <span key={opt.value} className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs">
              {opt.label}
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => remove(opt.value)}>×</button>
            </span>
          ))}
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              className="w-full justify-between border-gray-300 text-left font-normal text-muted-foreground"
            >
              <span>{placeholder || "Search and select"}</span>
              <span className="ml-2">▼</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] z-[101]" align="start" sideOffset={4}>
            <div className="p-2 border-b">
              <Input
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setActive((p) => Math.min(p + 1, Math.max(filtered.length - 1, 0))) }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((p) => Math.max(p - 1, 0)) }
                  else if (e.key === 'Enter') {
                    e.preventDefault(); const opt = filtered[active]; if (!opt) return;
                    const selected = (values || []).includes(opt.value)
                    const next = selected ? (values || []).filter((v) => v !== opt.value) : [...(values || []), opt.value]
                    onChange(next)
                  } else if (e.key === 'Escape') { setOpen(false) }
                }}
                className="h-8 border-gray-300 focus-visible:ring-gray-300 bg-white text-foreground"
                autoComplete="off"
                autoFocus
              />
            </div>
            <ScrollArea className="max-h-60 bg-white">
              {filtered.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">No results</div>
              ) : (
                filtered.map((opt, idx) => {
                  const selected = (values || []).includes(opt.value)
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${selected || idx === active ? 'bg-gray-100' : ''}`}
                      onClick={() => {
                        const next = selected
                          ? (values || []).filter((v) => v !== opt.value)
                          : [...(values || []), opt.value]
                        onChange(next)
                      }}
                      onMouseEnter={() => setActive(idx)}
                    >
                      {opt.label}
                    </button>
                  )
                })
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  // Transform caseData treatments to medicines format for edit mode
  React.useEffect(() => {
    if (open && mode === "edit" && caseData && caseData.treatments && Array.isArray(caseData.treatments) && caseData.treatments.length > 0) {
      // Filter out treatments with missing drug_id and transform to medicines format
      const transformedMedicines = caseData.treatments
        .filter((treatment: any) => treatment.drug_id && treatment.drug_id.trim() !== '')
        .map((treatment: any) => ({
          drug_name: treatment.drug_id,  // Map drug_id to drug_name (both are UUIDs)
          eye: treatment.eye || undefined,
          dosage: treatment.dosage_id || undefined,   // Map dosage_id to dosage (both are UUIDs)
          route: treatment.route_id || undefined,     // Map route_id to route (both are UUIDs)
          duration: treatment.duration || undefined,
          quantity: treatment.quantity || undefined
        }))
      
      // Only set medicines if we have valid transformed data
      if (transformedMedicines.length > 0) {
        form.setValue('medicines', transformedMedicines)
      }
    } else if (open && mode === "edit" && (!caseData?.treatments || (Array.isArray(caseData.treatments) && caseData.treatments.length === 0))) {
      // Clear medicines if there are no treatments
      form.setValue('medicines', [])
    }
  }, [open, mode, caseData, form])

  // Transform caseData surgeries to surgeries format for edit mode
  React.useEffect(() => {
    if (open && mode === "edit" && caseData && caseData.examination_data?.surgeries && Array.isArray(caseData.examination_data.surgeries) && caseData.examination_data.surgeries.length > 0) {
      // Filter out surgeries with missing surgery_name and transform to surgeries format
      const transformedSurgeries = caseData.examination_data.surgeries
        .filter((surgery: any) => surgery.surgery_name && surgery.surgery_name.trim() !== '')
        .map((surgery: any) => ({
          eye: surgery.eye || undefined,
          surgery_name: surgery.surgery_name, // Can be UUID or string
          anesthesia: surgery.anesthesia || undefined
        }))
      
      // Only set surgeries if we have valid transformed data
      if (transformedSurgeries.length > 0) {
        form.setValue('surgeries', transformedSurgeries)
      }
    } else if (open && mode === "edit" && (!caseData?.examination_data?.surgeries || (Array.isArray(caseData.examination_data?.surgeries) && caseData.examination_data.surgeries.length === 0))) {
      // Clear surgeries if there are no surgeries
      form.setValue('surgeries', [])
    }
  }, [open, mode, caseData, form])

  // Extract IOP, SAC test values, and diagrams from examination_data for edit mode
  React.useEffect(() => {
    if (open && mode === "edit" && caseData && caseData.examination_data) {
      const examData = caseData.examination_data
      
      // Extract IOP values
      if (examData.tests?.iop) {
        if (examData.tests.iop.right?.id) {
          form.setValue('iop_right', examData.tests.iop.right.id)
        }
        if (examData.tests.iop.left?.id) {
          form.setValue('iop_left', examData.tests.iop.left.id)
        }
      }
      
      // Extract SAC test values (new structure with right/left)
      if (examData.tests?.sac_test) {
        if (typeof examData.tests.sac_test === 'object' && examData.tests.sac_test.right) {
          form.setValue('sac_test_right', examData.tests.sac_test.right)
        }
        if (typeof examData.tests.sac_test === 'object' && examData.tests.sac_test.left) {
          form.setValue('sac_test_left', examData.tests.sac_test.left)
        }
        // Backwards compatibility: if sac_test is a string (old format)
        if (typeof examData.tests.sac_test === 'string') {
          // For old data, we can't determine which eye, so leave it empty
          // Or we could put it in both, but that's probably not desired
        }
      }
      
      // Extract diagram images
      if (examData.diagrams) {
        if (examData.diagrams.right) {
          form.setValue('right_eye_diagram', examData.diagrams.right)
        }
        if (examData.diagrams.left) {
          form.setValue('left_eye_diagram', examData.diagrams.left)
        }
      }
    }
  }, [open, mode, caseData, form])

  // Coordinate no_complaints_flag with complaints array
  const noComplaintsFlag = form.watch("no_complaints_flag");
  const complaints = form.watch("complaints");

  React.useEffect(() => {
    // If complaints are added, uncheck the no complaints flag
    if (complaints && complaints.length > 0 && noComplaintsFlag) {
      form.setValue("no_complaints_flag", false);
    }
  }, [complaints, noComplaintsFlag, form]);

  // Coordinate diagnosis_pending_flag with diagnosis array
  const diagnosisPendingFlag = form.watch("diagnosis_pending_flag");
  const diagnosis = form.watch("diagnosis");

  React.useEffect(() => {
    // If diagnosis is added, uncheck the diagnosis pending flag
    if (diagnosis && diagnosis.length > 0 && diagnosisPendingFlag) {
      form.setValue("diagnosis_pending_flag", false);
    }
  }, [diagnosis, diagnosisPendingFlag, form]);

  // Function to add new complaint
  const handleAddComplaint = () => {
    if (newComplaintId) {
      appendComplaint({
        categoryId: newComplaintCategoryId || null,
        complaintId: newComplaintId,
        eye: newComplaintEye || undefined,
        duration: newComplaintDuration || undefined,
        notes: newComplaintNotes || undefined,
      })
      setNewComplaintId("")
      setNewComplaintCategoryId(null)
      setNewComplaintEye("")
      setNewComplaintDuration("")
      setNewComplaintNotes("")
    }
  }

  // Function to add new medicine
  const handleAddMedicine = (medicineData?: { drug: string; eye: string; dosage: string; route: string; duration: string; quantity: string }) => {
    // If medicineData is provided (from inline buttons), use that, otherwise use current state
    const drug = medicineData?.drug || newMedicineDrug;
    const eye = medicineData?.eye || newMedicineEye;
    const dosage = medicineData?.dosage || newMedicineDosage;
    const route = medicineData?.route || newMedicineRoute;
    const duration = medicineData?.duration || newMedicineDuration;
    const quantity = medicineData?.quantity || newMedicineQuantity;

    // Require only essential fields: drug, eye, and dosage
    if (drug && eye && dosage) {
      appendMedicine({
        drug_name: drug,
        eye: eye,
        dosage: dosage,
        route: route,
        duration: duration,
        quantity: quantity,
      })
      setNewMedicineDrug("")
      setNewMedicineEye("")
      setNewMedicineDosage("")
      setNewMedicineRoute("")
      setNewMedicineDuration("")
      setNewMedicineQuantity("")
    } else {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Drug Name, Eye, and Dosage to add a medicine.",
        variant: "destructive",
      })
    }
  }

  // Function to add new surgery
  const handleAddSurgery = () => {
    // Require only essential fields: eye and surgery name
    if (newSurgeryEye && newSurgeryName) {
      appendSurgery({
        eye: newSurgeryEye,
        surgery_name: newSurgeryName,
        anesthesia: newSurgeryAnesthesia,
      })
      setNewSurgeryEye("")
      setNewSurgeryName("")
      setNewSurgeryAnesthesia("")
    } else {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Eye and Surgery Name to add surgery details.",
        variant: "destructive",
      })
    }
  }

  // Function to add new diagnostic test
  const handleAddDiagnosticTest = () => {
    if (newTestId) {
      appendDiagnosticTest({
        test_id: newTestId,
        eye: newTestEye || undefined,
        type: newTestType || undefined,
        problem: newTestProblem || undefined,
        notes: newTestNotes || undefined,
      })
      setNewTestId("")
      setNewTestEye("")
      setNewTestType("")
      setNewTestProblem("")
      setNewTestNotes("")
    }
  }

  // Dynamic patient options derived from master data
  // Removed patientOptions - now using patients state loaded from API

  async function onSubmit(values: z.infer<typeof caseFormSchema>) {
    setIsSubmitting(true)
    try {
      console.log('Form submission started with values:', values)
      
      if (!onSubmitCallback) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No submission handler provided.",
        })
        return
      }
      
      // Validate required fields
      if (!values.patient_id) {
        toast({
          variant: "destructive",
          title: "Missing Required Field",
          description: "Please select a patient before saving the case.",
        })
        setCurrentStep("register")
        return
      }
      
      if (!values.visit_type) {
        toast({
          variant: "destructive",
          title: "Missing Required Field",
          description: "Please select a visit type before saving the case.",
        })
        setCurrentStep("register")
        return
      }

      // Transform form data to match API expectations
      // Note: With our fixed SimpleCombobox components, form values are already UUIDs
      const transformedData = {
        patient_id: values.patient_id,
        case_no: values.case_no,
        encounter_date: values.case_date,
        visit_type: values.visit_type,
        chief_complaint: values.chief_complaint,
        history_of_present_illness: values.history_present_illness,
        past_medical_history: values.past_history_treatments?.map(t => 
          `${t.treatment} (${t.years} years)`
        ).join('; ') || undefined,
        
        // Transform past medications to structured JSONB
        past_medications: values.past_history_medicines?.map((m: any) => ({
          medicine_id: m.medicine_id || undefined,
          medicine_name: m.medicine_name,
          type: m.type || undefined,
          advice: m.advice || undefined,
          duration: m.duration || undefined,
          eye: m.eye || undefined
        })) || [],
        
        // Transform complaints array - using new hierarchical structure
        // Filter out empty complaints before transforming
        complaints: (values.complaints && Array.isArray(values.complaints))
          ? values.complaints
              .filter((c: any) => c.complaintId && c.complaintId.trim() !== '')
              .map((c: any) => ({
                complaintId: c.complaintId, // UUID from grouped dropdown
                categoryId: c.categoryId || null, // Category UUID from grouped dropdown
                eye: c.eye || undefined, // UUID from eye dropdown
                duration: c.duration || undefined,
                notes: c.notes || undefined
              }))
          : [],
        
        // Transform medicines (advice) array - values are already UUIDs
        // Filter out empty medicines before transforming to treatments
        // Always send treatments array (even if empty) so API can properly save/update
        treatments: (values.medicines && Array.isArray(values.medicines))
          ? values.medicines
              .filter((m: any) => m.drug_name && m.drug_name.trim() !== '')
              .map((m: any) => ({
                drug_id: m.drug_name, // Already a UUID from dropdown
                dosage_id: m.dosage || undefined, // Already a UUID from dropdown
                route_id: m.route || undefined, // Already a UUID from dropdown
                eye: m.eye || undefined, // Already a UUID from dropdown
                duration: m.duration || undefined,
                quantity: m.quantity || undefined
              }))
          : [],
        
        // Transform vision data
        vision_data: {
          unaided: {
            right: values.visual_acuity_unaided_right || undefined,
            left: values.visual_acuity_unaided_left || undefined
          },
          pinhole: {
            right: values.pinhole_right || undefined,
            left: values.pinhole_left || undefined
          },
          aided: {
            right: values.visual_acuity_aided_right || undefined,
            left: values.visual_acuity_aided_left || undefined
          },
          near: {
            right: values.near_visual_right || undefined,
            left: values.near_visual_left || undefined
          }
        },
        
        // Transform examination_data to include all examination fields and surgeries
        examination_data: {
          anterior_segment: {
            eyelids: { 
              right: values.eyelids_right || undefined, 
              left: values.eyelids_left || undefined 
            },
            conjunctiva: { 
              right: values.conjunctiva_right || undefined, 
              left: values.conjunctiva_left || undefined 
            },
            cornea: { 
              right: values.cornea_right || undefined, 
              left: values.cornea_left || undefined 
            },
            anterior_chamber: { 
              right: values.anterior_chamber_right || undefined, 
              left: values.anterior_chamber_left || undefined 
            },
            iris: { 
              right: values.iris_right || undefined, 
              left: values.iris_left || undefined 
            },
            lens: { 
              right: values.lens_right || undefined, 
              left: values.lens_left || undefined 
            },
            remarks: values.anterior_remarks || undefined
          },
          posterior_segment: {
            vitreous: { 
              right: values.vitreous_right || undefined, 
              left: values.vitreous_left || undefined 
            },
            disc: { 
              right: values.disc_right || undefined, 
              left: values.disc_left || undefined 
            },
            retina: { 
              right: values.retina_right || undefined, 
              left: values.retina_left || undefined 
            },
            remarks: values.posterior_remarks || undefined
          },
          refraction: {
            distant: {
              right: {
                sph: values.refraction_distant_sph_right || undefined,
                cyl: values.refraction_distant_cyl_right || undefined,
                axis: values.refraction_distant_axis_right || undefined,
                va: values.refraction_distant_va_right || undefined
              },
              left: {
                sph: values.refraction_distant_sph_left || undefined,
                cyl: values.refraction_distant_cyl_left || undefined,
                axis: values.refraction_distant_axis_left || undefined,
                va: values.refraction_distant_va_left || undefined
              }
            },
            near: {
              right: {
                sph: values.refraction_near_sph_right || undefined,
                cyl: values.refraction_near_cyl_right || undefined,
                axis: values.refraction_near_axis_right || undefined,
                va: values.refraction_near_va_right || undefined
              },
              left: {
                sph: values.refraction_near_sph_left || undefined,
                cyl: values.refraction_near_cyl_left || undefined,
                axis: values.refraction_near_axis_left || undefined,
                va: values.refraction_near_va_left || undefined
              }
            },
            pg: {
              right: {
                sph: values.refraction_pg_sph_right || undefined,
                cyl: values.refraction_pg_cyl_right || undefined,
                axis: values.refraction_pg_axis_right || undefined,
                va: values.refraction_pg_va_right || undefined
              },
              left: {
                sph: values.refraction_pg_sph_left || undefined,
                cyl: values.refraction_pg_cyl_left || undefined,
                axis: values.refraction_pg_axis_left || undefined,
                va: values.refraction_pg_va_left || undefined
              }
            },
            purpose: values.refraction_purpose || undefined,
            quality: values.refraction_quality || undefined,
            remark: values.refraction_remark || undefined
          },
          blood_investigation: {
            blood_pressure: values.blood_pressure || undefined,
            blood_sugar: values.blood_sugar || undefined,
            blood_tests: values.blood_tests || []
          },
          tests: {
            iop: values.iop_right || values.iop_left ? {
              right: values.iop_right ? { id: values.iop_right, value: masterData.data.iopRanges?.find((r: any) => r.value === values.iop_right)?.label || values.iop_right } : undefined,
              left: values.iop_left ? { id: values.iop_left, value: masterData.data.iopRanges?.find((r: any) => r.value === values.iop_left)?.label || values.iop_left } : undefined
            } : undefined,
            sac_test: values.sac_test_right || values.sac_test_left ? {
              right: values.sac_test_right || undefined,
              left: values.sac_test_left || undefined
            } : undefined
          },
          surgeries: (values.surgeries && Array.isArray(values.surgeries))
            ? values.surgeries
                .filter((s: any) => s.surgery_name && s.surgery_name.trim() !== '')
                .map((s: any) => ({
                  eye: s.eye || undefined, // Already a UUID from dropdown
                  surgery_name: s.surgery_name, // Already a UUID from dropdown
                  anesthesia: s.anesthesia || undefined
                }))
            : [],
          diagrams: {
            right: values.right_eye_diagram || undefined,
            left: values.left_eye_diagram || undefined
          }
        },
        
        // Diagnostic tests - combine manual tests with structured diagnostic_tests
        // Filter out empty diagnostic tests before transforming
        diagnostic_tests: (values.diagnostic_tests && Array.isArray(values.diagnostic_tests))
          ? values.diagnostic_tests
              .filter((t: any) => t.test_id && t.test_id.trim() !== '')
              .map((t: any) => ({
                test_id: t.test_id, // UUID from dropdown
                eye: t.eye || undefined,
                type: t.type || undefined,
                problem: t.problem || undefined,
                notes: t.notes || undefined
              }))
          : [],
        
        // Diagnosis (array of strings or UUIDs depending on how diagnosis dropdown is set up)
        diagnosis: values.diagnosis || [],
        
        // Other text fields
        examination_findings: values.anterior_remarks || values.posterior_remarks 
          ? `Anterior: ${values.anterior_remarks || 'N/A'}. Posterior: ${values.posterior_remarks || 'N/A'}` 
          : undefined,
        treatment_plan: values.treatments?.join(', ') || undefined,
        medications_prescribed: values.dosage || undefined,
        follow_up_instructions: values.surgery_advised || undefined,
        advice_remarks: values.advice_remarks || undefined,
        surgery_remarks: values.surgery_remarks || undefined,
        status: 'active'
      }
      
      console.log('Transformed case data:', transformedData)
      
      // Await the async callback - this will throw if there's an error
      await onSubmitCallback(transformedData)
      
      // Only close dialog and reset form on successful submission
      setOpen(false)
      form.reset()
      setCurrentStep("register")
    } catch (error: any) {
      // Error handling is done by the callback (handleAddCase), which shows toast and re-throws
      // Keep dialog open on error so user can fix issues
      console.error("Error submitting case form:", error)
      // Don't close dialog or reset form - let user see the error and fix it
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { id: "register", label: "Register", number: 1 },
    { id: "history", label: "Case History", number: 2 },
    { id: "patient-history", label: "Treatments & Medications", number: 3 },
    { id: "complaints", label: "Complaints", number: 4 },
    { id: "vision", label: "Vision", number: 5 },
    { id: "examination", label: "Examination", number: 6 },
    { id: "blood", label: "Blood Investigation", number: 7 },
    { id: "diagnosis", label: "Diagnosis & Tests", number: 8 },
    { id: "diagram", label: "Diagram", number: 9 },
    { id: "advice", label: "Advice", number: 10 },
  ]

  // Validate step based on current step
  const validateStep = async (stepId: string): Promise<boolean> => {
    // Handle steps with special validation logic first
    switch (stepId) {
      case "register":
        // Validate patient selection and visit type
        const patientId = form.getValues("patient_id");
        const visitType = form.getValues("visit_type");
        return !!patientId && !!visitType;
      case "complaints":
        // Validate that either at least one complaint is added OR the no complaints flag is set
        const complaints = form.getValues("complaints");
        const noComplaintsFlag = form.getValues("no_complaints_flag");
        return (Array.isArray(complaints) && complaints.length > 0) ||
               (noComplaintsFlag === true);
      case "diagnosis":
        // Validate that either at least one diagnosis is added OR the diagnosis pending flag is set
        const diagnosis = form.getValues("diagnosis");
        const diagnosisPendingFlag = form.getValues("diagnosis_pending_flag");
        return (Array.isArray(diagnosis) && diagnosis.length > 0) ||
               (diagnosisPendingFlag === true);
      case "advice":
        // Validate that at least one medicine or surgery is added
        const medicines = form.getValues("medicines");
        const surgeries = form.getValues("surgeries");
        return (Array.isArray(medicines) && medicines.length > 0) ||
               (Array.isArray(surgeries) && surgeries.length > 0);
      default:
        // For other steps, validate only the fields relevant to the current step
        // Determine fields to validate based on the current step
        let fieldsToValidate: Array<keyof z.infer<typeof caseFormSchema>> = [];
        switch (stepId) {
          case "history":
            fieldsToValidate = ["chief_complaint", "history_present_illness"];
            break;
          case "patient-history":
            fieldsToValidate = ["past_history_treatments", "past_history_medicines"];
            break;
          case "vision":
            fieldsToValidate = [
              // Visual acuity fields
              "visual_acuity_unaided_right", "visual_acuity_unaided_left",
              "pinhole_right", "pinhole_left",
              "visual_acuity_aided_right", "visual_acuity_aided_left",
              "near_visual_right", "near_visual_left",
              // Refraction fields - Distant
              "refraction_distant_sph_right", "refraction_distant_cyl_right", "refraction_distant_axis_right", "refraction_distant_va_right",
              "refraction_distant_sph_left", "refraction_distant_cyl_left", "refraction_distant_axis_left", "refraction_distant_va_left",
              // Refraction fields - Near
              "refraction_near_sph_right", "refraction_near_cyl_right", "refraction_near_axis_right", "refraction_near_va_right",
              "refraction_near_sph_left", "refraction_near_cyl_left", "refraction_near_axis_left", "refraction_near_va_left",
              // Refraction fields - PG (Post Gonioscopy)
              "refraction_pg_sph_right", "refraction_pg_cyl_right", "refraction_pg_axis_right", "refraction_pg_va_right",
              "refraction_pg_sph_left", "refraction_pg_cyl_left", "refraction_pg_axis_left", "refraction_pg_va_left",
              // Refraction general fields
              "refraction_purpose", "refraction_quality", "refraction_remark"
            ];
            break;
          case "examination":
            fieldsToValidate = [
              // Anterior Segment Examination
              "eyelids_right", "eyelids_left",
              "conjunctiva_right", "conjunctiva_left",
              "cornea_right", "cornea_left",
              "anterior_chamber_right", "anterior_chamber_left",
              "iris_right", "iris_left",
              "lens_right", "lens_left",
              "anterior_remarks",
              // Posterior Segment Examination
              "vitreous_right", "vitreous_left",
              "disc_right", "disc_left",
              "retina_right", "retina_left",
              "posterior_remarks"
            ];
            break;
          case "blood":
            fieldsToValidate = ["blood_tests"];
            break;
          case "diagram":
            fieldsToValidate = ["right_eye_diagram", "left_eye_diagram"];
            break;
          default:
            // If we can't determine the fields for the step, validate nothing
            fieldsToValidate = [];
        }

        // Validate only the relevant fields for the current step
        try {
          if (fieldsToValidate.length > 0) {
            const validationResults = await form.trigger(fieldsToValidate);

            // Check if there are any errors for the specific fields we validated
            const hasErrors = fieldsToValidate.some(field =>
              form.formState.errors.hasOwnProperty(field)
            );

            if (hasErrors) {
              // Build a list of the first few error names
              const errorFieldNames = fieldsToValidate.filter(field =>
                form.formState.errors.hasOwnProperty(field)
              ).slice(0, 3); // Take up to 3 field names to avoid a long message

              // Format the error message
              const errorFieldsList = errorFieldNames.join(", ");
              toast({
                variant: "destructive",
                title: "Validation Error",
                description: `Please complete required fields: ${errorFieldsList}`,
              });

              return false;
            }

            return validationResults;
          }
          return true; // If no fields to validate, consider step valid
        } catch {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: "An error occurred during validation. Please check your entries.",
          });
          return false;
        }
    }
  };

  // Track completed steps when user moves to next step
  const handleStepChange = async (newStep: string) => {
    // If we're not moving to the same step, validate the current step
    if (newStep !== currentStep) {
      const isStepValid = await validateStep(currentStep);

      if (isStepValid) {
        setCompletedSteps((prev) => new Set([...prev, currentStep]));
        // Remove from visited steps if it was there (completed takes priority)
        setVisitedSteps((prev) => {
          const newSet = new Set(prev);
          newSet.delete(currentStep);
          return newSet;
        });
      } else {
        // Mark as visited if validation fails
        setVisitedSteps((prev) => new Set([...prev, currentStep]));
      }
    }

    setCurrentStep(newStep);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent 
        className="max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col p-0"
        onCloseButtonClickOnly={true}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            {/* SECTION 1: Fixed Header (Stepper) */}
            <div className="flex-shrink-0">
              <DialogHeader className="px-6 pt-6 pb-3">
                <DialogTitle>{mode === "edit" ? "Edit Case" : "Add New Case"} - Multi-Step Registration</DialogTitle>
                <DialogDescription>
                  {mode === "edit" ? "Update case information" : "Complete patient case registration with medical examination"}
                </DialogDescription>
              </DialogHeader>
              {/* Horizontal Scrollable Stepper Rail */}
              <div
                role="tablist"
                className="flex overflow-x-auto items-center gap-2 p-3 border-b border-gray-200 bg-gray-50/50 no-scrollbar"
              >
                {steps.map((step) => {
                  const isActive = currentStep === step.id
                  const isCompleted = completedSteps.has(step.id)
                  const isVisited = visitedSteps.has(step.id)
                  return (
                    <button
                      key={step.id}
                      type="button"
                      role="tab"
                      tabIndex={isActive ? 0 : -1}
                      aria-selected={isActive}
                      aria-current={isActive ? "step" : undefined}
                      aria-label={`Step ${step.number}: ${step.label} ${isActive ? '(current step)' : isCompleted ? '(completed)' : isVisited ? '(visited)' : '(not completed)'}`}
                      onClick={() => handleStepChange(step.id)}
                      className={`
                        flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all
                        ${isActive
                          ? 'bg-gray-900 text-white shadow-md'
                          : isCompleted
                          ? 'bg-white text-emerald-600 border border-emerald-200 hover:bg-gray-50'
                          : isVisited
                          ? 'bg-white text-blue-600 border border-blue-200 hover:bg-gray-50'
                          : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
                        }
                      `}
                    >
                      {isCompleted && !isActive && (
                        <Check className="h-3 w-3 text-emerald-600" />
                      )}
                      {!isCompleted && isVisited && !isActive && (
                        <span className="h-3 w-3 text-blue-600">•</span>
                      )}
                      <span>{step.number}. {step.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* SECTION 2: Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <Tabs value={currentStep} onValueChange={handleStepChange} className="w-full h-full">
                <div className="px-6 py-4">
                  <div className="min-h-[400px]">
                <TabsContent value="register" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">1. Register & Patient Selection</h3>
                
                {/* Case Info Fields */}
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="case_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case No *</FormLabel>
                        <FormControl>
                          <Input placeholder="Auto-generated case number..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="case_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="visit_type"
                    render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visit Type * (Auto-detected)</FormLabel>
                          <FormControl>
                            <Input 
                              value={field.value} 
                              readOnly 
                              className="bg-muted"
                              placeholder="Will be auto-detected..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                    )}
                  />
                </div>

                {/* Patient Selection with Full History */}
                <div className="mt-6">
                  <PatientSelectorWithHistory
                    selectedPatient={selectedPatient}
                    onSelect={handlePatientSelect}
                    showCreateNew={false}
                  />
                </div>

                {/* Hidden field for form validation */}
                <FormField
                  control={form.control}
                  name="patient_id"
                  render={({ field }) => (
                    <input type="hidden" {...field} />
                  )}
                />
              </TabsContent>

              <TabsContent value="history" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">2. Case History</h3>
                
                {/* Chief Complaint Section */}
                <FormField
                  control={form.control}
                  name="chief_complaint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chief Complaint</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter chief complaint..." rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* History Present Illness Section */}
                <FormField
                  control={form.control}
                  name="history_present_illness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>History of Present Illness</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter history of present illness..." rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="patient-history" className="space-y-6 min-h-[350px]">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">3. Treatments & Medications</h3>
                </div>

                {/* Treatment Section */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Treatments</h4>
                    <Button 
                      type="button" 
                      className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100" 
                      onClick={() => setShowInlineTreatmentForm(true)}
                    >
                      Add Treatment
                    </Button>
                  </div>

                  {/* Input Row (When Adding) */}
                  {showInlineTreatmentForm && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-5">
                          <SearchableSelect
                            options={masterData.data.treatments}
                            value={newTreatment}
                            onValueChange={setNewTreatment}
                            placeholder="Select treatment"
                            searchPlaceholder="Search treatments..."
                            emptyText="No treatments found."
                            loading={masterData.loading.treatments}
                            className="h-10 bg-gray-50 border-gray-200 text-sm"
                          />
                        </div>
                        <div className="col-span-5">
                          <Input
                            placeholder="e.g. 2 Years"
                            value={newTreatmentYears}
                            onChange={(e) => setNewTreatmentYears(e.target.value)}
                            className="h-10 bg-gray-50 border-gray-200 text-sm"
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (newTreatment) {
                                appendTreatment({
                                  treatment: newTreatment,
                                  years: newTreatmentYears
                                })
                                setNewTreatment("")
                                setNewTreatmentYears("")
                                setShowInlineTreatmentForm(false)
                              }
                            }}
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                            title="Confirm"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowInlineTreatmentForm(false)
                              setNewTreatment("")
                              setNewTreatmentYears("")
                            }}
                            className="text-gray-400 hover:text-red-500 w-10 h-10 flex items-center justify-center transition-colors"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Added Items List */}
                  {treatmentFields.length === 0 ? (
                    <div className="text-center p-6 text-gray-400 text-sm">No treatments added.</div>
                  ) : (
                    <div className="space-y-0">
                      {treatmentFields.map((fieldItem, index) => {
                        const treatmentValue = form.watch(`past_history_treatments.${index}.treatment` as const)
                        const treatmentYears = form.watch(`past_history_treatments.${index}.years` as const)
                        const treatment = masterData.data.treatments?.find(t => t.value === treatmentValue)
                        
                        return (
                          <div 
                            key={fieldItem.id} 
                            className={`flex justify-between items-center p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                          >
                            <div className="flex-1 grid grid-cols-12 gap-3 items-center">
                              <div className="col-span-5 text-sm font-medium text-gray-700">
                                {treatment?.label || treatmentValue || "Unnamed Treatment"}
                              </div>
                              <div className="col-span-5 text-sm font-medium text-gray-700">
                                {treatmentYears || "-"}
                              </div>
                              <div className="col-span-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => removeTreatment(index)}
                                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                  title="Delete treatment"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Medicine Section */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Medicine</h4>
                    <Button 
                      type="button" 
                      className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100" 
                      onClick={() => setShowInlineMedicineForm(true)}
                    >
                      Add Medicine
                    </Button>
                  </div>

                  {/* Input Row (When Adding) */}
                  {showInlineMedicineForm && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-3">
                          <SearchableSelect
                            options={masterData.data.medicines || []}
                            value={newPastMedicineName}
                            onValueChange={setNewPastMedicineName}
                            placeholder="Medicine Name"
                            searchPlaceholder="Search medicines..."
                            emptyText="No medicines found."
                            loading={masterData.loading.medicines}
                            className="h-10 bg-gray-50 border-gray-200 text-sm"
                          />
                        </div>
                        <div className="col-span-3">
                          <SearchableSelect
                            options={masterData.data.dosages || []}
                            value={newPastMedicineType}
                            onValueChange={setNewPastMedicineType}
                            placeholder="Type/Frequency"
                            searchPlaceholder="Search dosages..."
                            emptyText="No dosages found."
                            loading={masterData.loading.dosages}
                            className="h-10 bg-gray-50 border-gray-200 text-sm"
                          />
                        </div>
                        <div className="col-span-4">
                          <Input
                            placeholder="Duration"
                            value={newPastMedicineDuration}
                            onChange={(e) => setNewPastMedicineDuration(e.target.value)}
                            className="h-10 bg-gray-50 border-gray-200 text-sm"
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (newPastMedicineName) {
                                appendPastMedicine({
                                  medicine_name: newPastMedicineName,
                                  type: newPastMedicineType,
                                  advice: "",
                                  duration: newPastMedicineDuration,
                                  eye: newPastMedicineEye
                                })
                                setNewPastMedicineName("")
                                setNewPastMedicineType("")
                                setNewPastMedicineDuration("")
                                setNewPastMedicineEye("R")
                                setShowInlineMedicineForm(false)
                              }
                            }}
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                            title="Confirm"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowInlineMedicineForm(false)
                              setNewPastMedicineName("")
                              setNewPastMedicineType("")
                              setNewPastMedicineDuration("")
                              setNewPastMedicineEye("R")
                            }}
                            className="text-gray-400 hover:text-red-500 w-10 h-10 flex items-center justify-center transition-colors"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Added Items List */}
                  {medicineFields.length === 0 ? (
                    <div className="text-center p-6 text-gray-400 text-sm">No medications added.</div>
                  ) : (
                    <div className="space-y-0">
                      {medicineFields.map((fieldItem, index) => {
                        const medicineName = form.watch(`past_history_medicines.${index}.medicine_name` as const)
                        const medicineType = form.watch(`past_history_medicines.${index}.type` as const)
                        const medicineDuration = form.watch(`past_history_medicines.${index}.duration` as const)
                        
                        const medicine = masterData.data.medicines?.find(m => m.value === medicineName)
                        const dosage = masterData.data.dosages?.find(d => d.value === medicineType)
                        
                        return (
                          <div 
                            key={fieldItem.id} 
                            className={`flex justify-between items-center p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                          >
                            <div className="flex-1 grid grid-cols-12 gap-3 items-center">
                              <div className="col-span-3 text-sm font-medium text-gray-700">
                                {medicine?.label || medicineName || "Unnamed Medicine"}
                              </div>
                              <div className="col-span-3 text-sm font-medium text-gray-700">
                                {dosage?.label || medicineType || "N/A"}
                              </div>
                              <div className="col-span-4 text-sm font-medium text-gray-700">
                                {medicineDuration || "No duration"}
                              </div>
                              <div className="col-span-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => removePastMedicine(index)}
                                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                  title="Delete medicine"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="complaints" className="space-y-6 min-h-[350px]">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Complaints</h3>
                  <Button
                    type="button"
                    className="text-xs font-bold text-indigo-600 border border-indigo-200 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100"
                    onClick={() => {
                      // Reset form and toggle visibility
                      setNewComplaintId("")
                      setNewComplaintCategoryId(null)
                      setNewComplaintEye("")
                      setNewComplaintDuration("")
                      setNewComplaintNotes("")
                      setShowComplaintForm(!showComplaintForm)
                    }}
                    aria-expanded={showComplaintForm}
                    aria-controls="complaint-form-section"
                  >
                    {showComplaintForm ? "Cancel" : "Add Complaint"}
                  </Button>
                </div>

                {/* Add Complaint Form */}
                {showComplaintForm && (
                  <div id="complaint-form-section" className="border rounded-lg p-4 space-y-4 bg-gray-50">
                    <h4 className="text-sm font-semibold">Add New Complaint</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-sm font-medium block mb-1.5">Complaint *</label>
                        <GroupedSearchableSelect
                          groups={complaintGroups}
                          value={newComplaintId}
                          onValueChange={(complaintId, categoryId) => {
                            setNewComplaintId(complaintId)
                            setNewComplaintCategoryId(categoryId)
                          }}
                          placeholder="Select complaint (grouped by category)"
                          searchPlaceholder="Search complaints..."
                          emptyText="No complaints found"
                          loading={complaintGroups.length === 0}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1.5">Eye</label>
                        <SimpleCombobox
                          options={(masterData.data.eyeSelection || [])}
                          value={newComplaintEye}
                          onChange={(value) => setNewComplaintEye(value)}
                          placeholder="Select eye"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1.5">Duration</label>
                        <Input
                          placeholder="e.g., 2 days, 1 week"
                          value={newComplaintDuration}
                          onChange={(e) => setNewComplaintDuration(e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium block mb-1.5">Notes</label>
                        <Textarea
                          placeholder="Additional details about the complaint..."
                          value={newComplaintNotes}
                          onChange={(e) => setNewComplaintNotes(e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddComplaint}
                        disabled={!newComplaintId}
                      >
                        Add Complaint
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowComplaintForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Complaints List */}
                <div className="space-y-3">
                      {complaintFields.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground text-sm">
                            No complaints added.
                    </div>
                      ) : (
                        complaintFields.map((field, index) => {
                          // Find complaint name from groups
                          const complaint = complaintGroups
                            .flatMap(g => g.children)
                            .find(c => c.id === (field as any).complaintId)
                          
                          // Find eye name from master data
                          const eyeOption = masterData.data.eyeSelection?.find(
                            e => e.value === (field as any).eye
                          )
                          
                          // Helper to check if value is UUID
                          const isUUID = (val: string | undefined | null): boolean => {
                            if (!val || typeof val !== 'string') return false
                            return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
                          }
                          
                          // Get complaint name - never show UUID
                          const complaintName = complaint?.name || ((field as any).complaintId && !isUUID((field as any).complaintId) ? (field as any).complaintId : 'N/A')
                          // Get eye label - never show UUID
                          const eyeLabel = eyeOption?.label || ((field as any).eye && !isUUID((field as any).eye) ? (field as any).eye : 'N/A')
                          
                          return (
                        <div key={field.id} className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-3 flex items-end gap-4">
                          <div className="flex-1">
                            <div className="text-xs text-gray-600 mb-1">Complaint</div>
                            <div className="text-sm font-medium">{complaintName}</div>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-600 mb-1">Eye</div>
                            <div className="text-sm">{eyeLabel}</div>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-600 mb-1">Duration</div>
                            <div className="text-sm">{(field as any).duration || '-'}</div>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-600 mb-1">Notes</div>
                            <div className="text-sm truncate" title={(field as any).notes}>
                                {(field as any).notes || '-'}
                            </div>
                          </div>
                          <button
                                  type="button"
                                  onClick={() => removeComplaint(index)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-2"
                            title="Remove complaint"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                          )
                        })
                      )}
                </div>

                {/* No Complaints Flag */}
                <div className="mt-4 border-t pt-4">
                  <FormField
                    control={form.control}
                    name="no_complaints_flag"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={field.value || false}
                              onChange={e => field.onChange(e.currentTarget.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              id="no_complaints_flag"
                            />
                          </div>
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel htmlFor="no_complaints_flag" className="font-medium text-sm">
                            No complaints to record
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Check this if the patient has no complaints to record
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

              </TabsContent>

              <TabsContent value="vision" className="space-y-6 min-h-[350px]">
                {/* Vision Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-semibold text-md">VISION</h4>
                  </div>

                  {/* Comparison Layout */}
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div></div>
                      <div className="text-center text-xs font-bold text-gray-900 bg-gray-50 py-2 rounded">RIGHT EYE (OD)</div>
                      <div className="text-center text-xs font-bold text-gray-900 bg-gray-50 py-2 rounded">LEFT EYE (OS)</div>
                    </div>

                    {/* Visual Acuity (Unaided) */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">VISUAL ACUITY (UNAIDED) (VP)</div>
                            <FormField control={form.control} name="visual_acuity_unaided_right" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="Select VP"
                          className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                              />
                            )} />
                            <FormField control={form.control} name="visual_acuity_unaided_left" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="Select VP"
                          className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                              />
                            )} />
                    </div>

                    {/* Pin-Hole */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">PIN-HOLE (VP)</div>
                            <FormField control={form.control} name="pinhole_right" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="Select VP"
                          className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                              />
                            )} />
                            <FormField control={form.control} name="pinhole_left" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="Select VP"
                          className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                              />
                            )} />
                    </div>

                    {/* Visual Acuity (Aided) */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">VISUAL ACUITY (AIDED) (VP)</div>
                            <FormField control={form.control} name="visual_acuity_aided_right" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="Select VP"
                          className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                              />
                            )} />
                            <FormField control={form.control} name="visual_acuity_aided_left" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="Select VP"
                          className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                              />
                            )} />
                    </div>

                    {/* Near Visual */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">NEAR VISUAL</div>
                            <FormField control={form.control} name="near_visual_right" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="Select VP"
                          className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                              />
                            )} />
                            <FormField control={form.control} name="near_visual_left" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="Select VP"
                          className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                              />
                            )} />
                    </div>
                  </div>
                </div>

                {/* Refraction Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-semibold text-md">REFRACTION</h4>
                  </div>

                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div></div>
                      <div className="text-center text-xs font-bold text-gray-900 bg-gray-50 py-2 rounded">RIGHT EYE (OD)</div>
                      <div className="text-center text-xs font-bold text-gray-900 bg-gray-50 py-2 rounded">LEFT EYE (OS)</div>
                    </div>

                    {/* Sub-header for SPH, CYL, AXIS, VA */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div></div>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium text-gray-600">
                        <div>SPH</div>
                        <div>CYL</div>
                        <div>AXIS</div>
                        <div>VA</div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium text-gray-600">
                        <div>SPH</div>
                        <div>CYL</div>
                        <div>AXIS</div>
                        <div>VA</div>
                      </div>
                    </div>

                        {/* Distant Row */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">DISTANT</div>
                      <div className="grid grid-cols-4 gap-2">
                            <FormField control={form.control} name="refraction_distant_sph_right" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. -2.25" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_distant_cyl_right" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. -0.5" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_distant_axis_right" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. 180" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_distant_va_right" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="VP"
                            className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                              />
                            )} />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                            <FormField control={form.control} name="refraction_distant_sph_left" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. -2.25" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_distant_cyl_left" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. -0.5" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_distant_axis_left" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. 180" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_distant_va_left" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="VP"
                            className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                              />
                            )} />
                      </div>
                    </div>

                        {/* Near Row */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">NEAR</div>
                      <div className="grid grid-cols-4 gap-2">
                            <FormField control={form.control} name="refraction_near_sph_right" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. -2.25" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_near_cyl_right" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. -0.5" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_near_axis_right" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. 180" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_near_va_right" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="VP"
                            className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                              />
                            )} />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                            <FormField control={form.control} name="refraction_near_sph_left" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. -2.25" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_near_cyl_left" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. -0.5" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_near_axis_left" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. 180" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_near_va_left" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="VP"
                            className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                              />
                            )} />
                      </div>
                    </div>

                        {/* PG Row */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">PG</div>
                      <div className="grid grid-cols-4 gap-2">
                            <FormField control={form.control} name="refraction_pg_sph_right" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. -2.25" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_pg_cyl_right" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. -0.5" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_pg_axis_right" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. 180" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_pg_va_right" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="VP"
                            className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                              />
                            )} />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                            <FormField control={form.control} name="refraction_pg_sph_left" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. -2.25" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_pg_cyl_left" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. -0.5" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_pg_axis_left" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="e.g. 180" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="refraction_pg_va_left" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="VP"
                            className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                              />
                            )} />
                      </div>
                    </div>

                        {/* Purpose Row */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">PURPOSE</div>
                      <div className="col-span-2">
                            <FormField control={form.control} name="refraction_purpose" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="Constant Use" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                      </div>
                    </div>

                        {/* Quality Row */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">QUALITY</div>
                      <div className="col-span-2">
                            <FormField control={form.control} name="refraction_quality" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                            )} />
                      </div>
                    </div>

                        {/* Remark Row */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">REMARK</div>
                      <div className="col-span-2">
                            <FormField control={form.control} name="refraction_remark" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                        )} />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="examination" className="space-y-6 min-h-[350px]">
                <h3 className="font-semibold text-lg">6. Examination</h3>
                
                {/* Anterior Segment */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-semibold text-md">ANTERIOR SEGMENT</h4>
                  </div>

                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div></div>
                      <div className="text-center text-xs font-bold text-gray-900 bg-gray-50 py-2 rounded">RIGHT EYE (OD)</div>
                      <div className="text-center text-xs font-bold text-gray-900 bg-gray-50 py-2 rounded">LEFT EYE (OS)</div>
                    </div>

                    {/* EYELIDS */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">EYELIDS</div>
                    <FormField
                      control={form.control}
                      name="eyelids_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Right Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="eyelids_left"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Left Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    </div>

                    {/* CONJUNCTIVA */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">CONJUNCTIVA</div>
                    <FormField
                      control={form.control}
                      name="conjunctiva_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Right Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="conjunctiva_left"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Left Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    </div>

                    {/* CORNEA */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">CORNEA</div>
                    <FormField
                      control={form.control}
                      name="cornea_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Right Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cornea_left"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Left Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    </div>

                    {/* ANTERIOR CHAMBER */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">ANTERIOR CHAMBER</div>
                    <FormField
                      control={form.control}
                      name="anterior_chamber_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Right Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="anterior_chamber_left"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Left Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    </div>

                    {/* IRIS */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">IRIS</div>
                    <FormField
                      control={form.control}
                      name="iris_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Right Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="iris_left"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Left Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    </div>

                    {/* LENS */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">LENS</div>
                    <FormField
                      control={form.control}
                      name="lens_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Right Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lens_left"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Left Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                    {/* REMARKS */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">REMARKS</div>
                      <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="anterior_remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                                <Input placeholder="REMARKS" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Posterior Segment */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-semibold text-md">POSTERIOR SEGMENT</h4>
                  </div>

                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div></div>
                      <div className="text-center text-xs font-bold text-gray-900 bg-gray-50 py-2 rounded">RIGHT EYE (OD)</div>
                      <div className="text-center text-xs font-bold text-gray-900 bg-gray-50 py-2 rounded">LEFT EYE (OS)</div>
                    </div>

                    {/* VITREOUS */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">VITREOUS</div>
                    <FormField
                      control={form.control}
                      name="vitreous_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Right Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vitreous_left"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Left Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    </div>

                    {/* DISC */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">DISC</div>
                    <FormField
                      control={form.control}
                      name="disc_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Right Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="disc_left"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Left Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    </div>

                    {/* RETINA */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">RETINA</div>
                    <FormField
                      control={form.control}
                      name="retina_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Right Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="retina_left"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Left Eye" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                    {/* REMARKS */}
                    <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                      <div className="text-right text-xs font-bold text-gray-500 uppercase">REMARKS</div>
                      <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="posterior_remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                                <Input placeholder="REMARKS" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="blood" className="space-y-6 min-h-[350px]">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Blood Investigation</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="blood_tests"
                  render={({ field }) => {
                    const selectedTests = field.value || []

                    // Group master data blood tests by category (if available)
                    // If bloodTests don't have categories, we'll use a default structure
                    let bloodTestCategories;
                    if (masterData.data.bloodTests && masterData.data.bloodTests.length > 0) {
                      // Group bloodTests by a category field if available, otherwise use default grouping
                      // Since the API master data might not have categories, we'll create a default structure
                      // or group by a property if available in the metadata
                      const allTests = masterData.data.bloodTests.map(bt => ({
                        id: bt.value,
                        label: bt.label
                      }));

                      // For now, use a simple fallback structure if we have master data
                      bloodTestCategories = [
                        {
                          name: "Blood Tests",
                          tests: allTests
                        }
                      ];
                    } else {
                      // Fallback to BLOOD_TEST_OPTIONS if master data is not available
                      // Map the string array to categorized object structure
                      const allTests = BLOOD_TEST_OPTIONS.map(test => ({ id: test, label: test }));

                      // Group tests by categories based on similar function/type
                      const generalTests = allTests.filter(t => ["CBC", "BT", "CT", "PT-INR"].includes(t.id));
                      const sugarTests = allTests.filter(t => ["RBS", "FBS", "PP2BS"].includes(t.id));
                      const serologyTests = allTests.filter(t => ["HIV", "HBSAG", "HCV"].includes(t.id));
                      const autoimmuneTests = allTests.filter(t => ["ANA-PROFILE", "P-ANCA", "C-ANCA", "R.A.FACTOR"].includes(t.id));
                      const hormoneTests = allTests.filter(t => ["T3 , T4, TSH, ANTI TPO", "S CREATININE", "S. SODIUM LEVELS"].includes(t.id));
                      const otherTests = allTests.filter(t =>
                        !["CBC", "BT", "CT", "PT-INR", "RBS", "FBS", "PP2BS", "HIV", "HBSAG", "HCV", "ANA-PROFILE", "P-ANCA", "C-ANCA", "R.A.FACTOR", "T3 , T4, TSH, ANTI TPO", "S CREATININE", "S. SODIUM LEVELS"].includes(t.id)
                      );

                      bloodTestCategories = [
                        ...(generalTests.length > 0 && [{ name: "General", tests: generalTests }]),
                        ...(sugarTests.length > 0 && [{ name: "Blood Sugar", tests: sugarTests }]),
                        ...(serologyTests.length > 0 && [{ name: "Serology", tests: serologyTests }]),
                        ...(autoimmuneTests.length > 0 && [{ name: "Autoimmune", tests: autoimmuneTests }]),
                        ...(hormoneTests.length > 0 && [{ name: "Hormones & Biochemistry", tests: hormoneTests }]),
                        ...(otherTests.length > 0 && [{ name: "Other", tests: otherTests }])
                      ];
                    }

                    const handleToggle = (testId: string) => {
                      const newSelected = selectedTests.includes(testId)
                        ? selectedTests.filter((id: string) => id !== testId)
                        : [...selectedTests, testId]
                      field.onChange(newSelected)
                    }

                    return (
                      <div className="space-y-6">
                        {bloodTestCategories.map((category) => (
                          <div key={category.name} className="space-y-3">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              {category.name}
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {category.tests.map((test) => {
                                const isSelected = selectedTests.includes(test.id)
                                return (
                                  <div
                                    key={test.id}
                                    onClick={() => handleToggle(test.id)}
                                    className={`
                                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                      ${isSelected
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white border-gray-200 hover:border-gray-400'
                                      }
                                    `}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggle(test.id)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-4 w-4 cursor-pointer"
                                    />
                                    <label className="text-sm font-medium select-none cursor-pointer flex-1">
                                      {test.label}
                                    </label>
                                </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                    )
                  }}
                />
              </TabsContent>

              <TabsContent value="diagnosis" className="space-y-6 min-h-[350px]">
                <h3 className="font-semibold text-lg">8. Diagnosis & Tests</h3>
                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => {
                    const selectedDiagnoses = field.value || []
                    const diagnosisOptions = (masterData.data.diagnosis || []).map(d => ({
                      value: d.value,
                      label: d.label
                    }))
                    
                    const selectedOptions = diagnosisOptions.filter(opt => 
                      selectedDiagnoses.includes(opt.value)
                    )

                    const handleRemove = (valueToRemove: string) => {
                      const newValue = selectedDiagnoses.filter((v: string) => v !== valueToRemove)
                      field.onChange(newValue)
                    }

                    return (
                    <FormItem>
                      <FormLabel>Diagnosis</FormLabel>
                      <FormControl>
                          <div className="space-y-4">
                            {/* Large Search Bar */}
                            <MultiSelect
                              options={diagnosisOptions}
                              value={field.value as any}
                              onValueChange={field.onChange}
                              placeholder="Search and select diagnosis"
                              searchPlaceholder="Search diagnoses..."
                              className="h-12 text-lg"
                              searchInputSize="large"
                            />
                            
                            {/* Selected Tags/Chips */}
                            {selectedOptions.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {selectedOptions.map((option) => (
                                  <div
                                    key={option.value}
                                    className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                                  >
                                    <span>{option.label}</span>
                                    <X
                                      className="h-4 w-4 hover:text-red-600 cursor-pointer transition-colors"
                                      onClick={() => handleRemove(option.value)}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    )
                  }}
                />

                {/* Diagnosis Pending Flag */}
                <FormField
                  control={form.control}
                  name="diagnosis_pending_flag"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                      <FormControl>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={field.value || false}
                            onChange={e => field.onChange(e.currentTarget.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            id="diagnosis_pending_flag"
                          />
                        </div>
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel htmlFor="diagnosis_pending_flag" className="font-medium text-sm">
                          Diagnosis pending
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Check this if diagnosis is pending and will be added later
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Diagnostic Tests Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Diagnostic Test</h3>
                </div>

                {/* SAC SYRINGING Section */}
                  <div className="space-y-4 mb-6">
                  <h4 className="font-medium text-sm">SAC SYRINGING</h4>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Right Eye */}
                    <div className="space-y-3">
                      <div className="text-center text-sm font-medium text-muted-foreground">RIGHT EYE</div>
                        <FormField
                          control={form.control}
                          name="sac_test_right"
                          render={({ field }) => (
                            <SimpleCombobox
                              options={(masterData.data.sacStatus || [])}
                              value={field.value || ""}
                              onChange={(value) => field.onChange(value)}
                                    placeholder="Select status"
                            />
                          )}
                        />
                    </div>
                    {/* Left Eye */}
                    <div className="space-y-3">
                      <div className="text-center text-sm font-medium text-muted-foreground">LEFT EYE</div>
                        <FormField
                          control={form.control}
                          name="sac_test_left"
                          render={({ field }) => (
                            <SimpleCombobox
                              options={(masterData.data.sacStatus || [])}
                              value={field.value || ""}
                              onChange={(value) => field.onChange(value)}
                                    placeholder="Select status"
                            />
                          )}
                        />
                    </div>
                  </div>
                </div>

                {/* I.O.P. Section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">I.O.P.</h4>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Right Eye */}
                    <div className="space-y-2">
                      <div className="text-center text-sm font-medium text-muted-foreground">RIGHT EYE</div>
                        <FormField
                          control={form.control}
                          name="iop_right"
                          render={({ field }) => (
                            <SimpleCombobox
                              options={(masterData.data.iopRanges || [])}
                              value={field.value || ""}
                              onChange={(value) => field.onChange(value)}
                            placeholder="Select I.O.P. Right"
                          />
                          )}
                        />
                    </div>
                    {/* Left Eye */}
                    <div className="space-y-2">
                      <div className="text-center text-sm font-medium text-muted-foreground">LEFT EYE</div>
                        <FormField
                          control={form.control}
                          name="iop_left"
                          render={({ field }) => (
                            <SimpleCombobox
                              options={(masterData.data.iopRanges || [])}
                              value={field.value || ""}
                              onChange={(value) => field.onChange(value)}
                            placeholder="Select I.O.P. Left"
                          />
                          )}
                        />
                      </div>
                    </div>
                  </div>

                {/* Additional Diagnostic Tests Section */}
                <div className="border-t pt-6 space-y-4">
                  <h4 className="font-medium text-sm">Additional Diagnostic Tests</h4>
                  
                  {/* Add Test Form */}
                  <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                    <h5 className="text-sm font-semibold">Add Diagnostic Test</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-sm font-medium block mb-1.5">Test Type *</label>
                        <SimpleCombobox
                          options={masterData.data.diagnosticTests || []}
                          value={newTestId}
                          onChange={(value) => setNewTestId(value)}
                          placeholder="Select diagnostic test"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1.5">Eye</label>
                        <SimpleCombobox
                          options={masterData.data.eyeSelection || []}
                          value={newTestEye}
                          onChange={(value) => setNewTestEye(value)}
                          placeholder="Select eye"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1.5">Type/Category</label>
                        <Input
                          placeholder="e.g., Routine, Urgent"
                          value={newTestType}
                          onChange={(e) => setNewTestType(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1.5">Problem/Indication</label>
                        <Input
                          placeholder="e.g., Glaucoma check"
                          value={newTestProblem}
                          onChange={(e) => setNewTestProblem(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1.5">Notes</label>
                        <Input
                          placeholder="Additional details"
                          value={newTestNotes}
                          onChange={(e) => setNewTestNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddDiagnosticTest}
                      disabled={!newTestId}
                    >
                      Add Test
                    </Button>
                  </div>

                  {/* Diagnostic Tests Table */}
                  {diagnosticTestFields.length > 0 && (
                    <div className="border rounded-lg">
                      <table className="w-full">
                        <thead className="border-b bg-gray-50">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium">TEST</th>
                            <th className="text-left p-3 text-sm font-medium">EYE</th>
                            <th className="text-left p-3 text-sm font-medium">TYPE</th>
                            <th className="text-left p-3 text-sm font-medium">PROBLEM</th>
                            <th className="text-left p-3 text-sm font-medium">NOTES</th>
                            <th className="text-left p-3 text-sm font-medium">ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {diagnosticTestFields.map((field, index) => {
                            const test = masterData.data.diagnosticTests?.find(
                              t => t.value === (field as any).test_id
                            )
                            const eyeOption = masterData.data.eyeSelection?.find(
                              e => e.value === (field as any).eye
                            )
                            
                            // Helper to check if value is UUID
                            const isUUID = (val: string | undefined | null): boolean => {
                              if (!val || typeof val !== 'string') return false
                              return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
                            }
                            
                            // Get test label - never show UUID
                            const testLabel = test?.label || ((field as any).test_id && !isUUID((field as any).test_id) ? (field as any).test_id : 'N/A')
                            // Get eye label - never show UUID
                            const eyeLabel = eyeOption?.label || ((field as any).eye && !isUUID((field as any).eye) ? (field as any).eye : 'N/A')
                            
                            return (
                              <tr key={field.id} className="border-b">
                                <td className="p-3 text-sm">{testLabel}</td>
                                <td className="p-3 text-sm">{eyeLabel}</td>
                                <td className="p-3 text-sm">{(field as any).type || '-'}</td>
                                <td className="p-3 text-sm">{(field as any).problem || '-'}</td>
                                <td className="p-3 text-sm">{(field as any).notes || '-'}</td>
                                <td className="p-3 text-sm">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeDiagnosticTest(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    Remove
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Advice/Remarks Section */}
                <div className="border-t pt-6 mt-6">
                  <FormField
                    control={form.control}
                    name="advice_remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Advice / Remarks</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter advice or remarks..."
                            rows={4}
                            className="bg-gray-50 w-full"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                </div>
              </TabsContent>

              <TabsContent value="diagram" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">9. Diagram</h3>
                <EyeDrawingTool
                  rightEye={form.watch("right_eye_diagram")}
                  leftEye={form.watch("left_eye_diagram")}
                  onChangeAction={(side: 'right' | 'left', dataUrl: string) => {
                    if (side === 'right') form.setValue('right_eye_diagram', dataUrl, { shouldDirty: true })
                    else form.setValue('left_eye_diagram', dataUrl, { shouldDirty: true })
                  }}
                />
              </TabsContent>

              <TabsContent value="advice" className="space-y-6 min-h-[350px]">
                {/* Advice Section */}
                <div className="space-y-6">
                  {/* Drugs Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Prescription</h3>
                      <Button
                        type="button"
                        className="text-xs font-bold text-indigo-600 border border-indigo-200 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100"
                        onClick={() => setShowMedicineForm(!showMedicineForm)}
                      >
                        {showMedicineForm ? "Cancel Drug" : "Add Drug"}
                      </Button>
                    </div>

                    {/* Input Row */}
                    {showMedicineForm && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                          <div className="col-span-2">
                            <label className="text-sm font-medium mb-1 block">Drug Name</label>
                            <SimpleCombobox
                              options={(masterData.data.medicines || [])}
                              value={newMedicineDrug}
                              onChange={(value) => setNewMedicineDrug(value)}
                              placeholder="Select drug"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Eye</label>
                            <SimpleCombobox
                              options={(masterData.data.eyeSelection || [])}
                              value={newMedicineEye}
                              onChange={(value) => setNewMedicineEye(value)}
                              placeholder="Select eye"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Dosage</label>
                            <SimpleCombobox
                              options={(masterData.data.dosages || [])}
                              value={newMedicineDosage}
                              onChange={(value) => setNewMedicineDosage(value)}
                              placeholder="Select dosage"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Route</label>
                            <SimpleCombobox
                              options={(masterData.data.routes || [])}
                              value={newMedicineRoute}
                              onChange={(value) => setNewMedicineRoute(value)}
                              placeholder="Select route"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Duration</label>
                            <Input
                              placeholder="Days"
                              value={newMedicineDuration}
                              onChange={(e) => setNewMedicineDuration(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Qty</label>
                            <Input
                              placeholder="Quantity"
                              value={newMedicineQuantity}
                              onChange={(e) => setNewMedicineQuantity(e.target.value)}
                            />
                          </div>
                          <div className="flex items-end">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  // Add medicine if all required fields are filled
                                  if (newMedicineDrug) {
                                    handleAddMedicine({
                                      drug: newMedicineDrug,
                                      eye: newMedicineEye || "",
                                      dosage: newMedicineDosage || "",
                                      route: newMedicineRoute || "",
                                      duration: newMedicineDuration || "",
                                      quantity: newMedicineQuantity || ""
                                    })
                                  }
                                }}
                                className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                                title="Add Medicine"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  // Clear all newMedicine* state fields and hide the form
                                  setNewMedicineDrug("")
                                  setNewMedicineEye("")
                                  setNewMedicineDosage("")
                                  setNewMedicineRoute("")
                                  setNewMedicineDuration("")
                                  setNewMedicineQuantity("")
                                  setShowMedicineForm(false)
                                }}
                                className="text-gray-400 hover:text-red-500 w-10 h-10 flex items-center justify-center transition-colors"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cards List */}
                    {medicineAdviceFields.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                        <Pill className="h-8 w-8 text-gray-300 mb-2" />
                        <p className="text-gray-400 text-sm">No items added.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {medicineAdviceFields.map((field, index) => {
                          // Helper to check if value is UUID
                          const isUUID = (val: string | undefined | null): boolean => {
                            if (!val || typeof val !== 'string') return false
                            return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
                          }
                          
                          const drug = masterData.data.medicines?.find(m => m.value === (field as any).drug_name)
                          const eye = masterData.data.eyeSelection?.find(e => e.value === (field as any).eye)
                          const dosage = masterData.data.dosages?.find(d => d.value === (field as any).dosage)
                          const route = masterData.data.routes?.find(r => r.value === (field as any).route)
                          
                          // Get drug name - never show UUID
                          const drugName = drug?.label || ((field as any).drug_name && !isUUID((field as any).drug_name) ? (field as any).drug_name : "N/A")
                          // Get eye label - never show UUID
                          const eyeLabel = eye?.label || ((field as any).eye && !isUUID((field as any).eye) ? (field as any).eye : 'N/A')
                          
                          return (
                            <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-3 mb-2 shadow-sm flex justify-between items-center">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 mb-1">
                                  {drugName}
                                </div>
                                <div className="text-xs text-gray-500 space-x-2">
                                  <span>{eyeLabel}</span>
                                  {dosage?.label && <span>• {dosage.label}</span>}
                                  {route?.label && <span>• {route.label}</span>}
                                  {(field as any).duration && <span>• {(field as any).duration} days</span>}
                                  {(field as any).quantity && <span>• Qty: {(field as any).quantity}</span>}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeMedicine(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Surgery Details Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Surgery Details</h3>
                    <Button
                      type="button"
                      className="text-xs font-bold text-indigo-600 border border-indigo-200 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100"
                      onClick={() => setShowSurgeryForm(!showSurgeryForm)}
                    >
                      {showSurgeryForm ? "Cancel Surgery" : "Add Surgery"}
                    </Button>
                  </div>

                  {/* Input Row */}
                  {showSurgeryForm && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Eye</label>
                          <SimpleCombobox
                            options={masterData.data.eyeSelection || []}
                            value={newSurgeryEye}
                            onChange={(value) => setNewSurgeryEye(value)}
                            placeholder="Select eye"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Surgery Name</label>
                          <SimpleCombobox
                            options={masterData.data.surgeries || []}
                            value={newSurgeryName}
                            onChange={(value) => setNewSurgeryName(value)}
                            placeholder="Select surgery"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Anesthesia</label>
                          <Input
                            placeholder="Enter anesthesia"
                            value={newSurgeryAnesthesia}
                            onChange={(e) => setNewSurgeryAnesthesia(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-3 space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            setNewSurgeryEye("");
                            setNewSurgeryName("");
                            setNewSurgeryAnesthesia("");
                            setShowSurgeryForm(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          onClick={handleAddSurgery}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Add Surgery
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Cards List */}
                  {surgeryFields.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                      <Pill className="h-8 w-8 text-gray-300 mb-2" />
                      <p className="text-gray-400 text-sm">No items added.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {surgeryFields.map((field, index) => {
                        // Helper to check if value is UUID
                        const isUUID = (val: string | undefined | null): boolean => {
                          if (!val || typeof val !== 'string') return false
                          return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
                        }
                        
                        const eye = masterData.data.eyeSelection?.find(e => e.value === (field as any).eye)
                        const surgery = masterData.data.surgeries?.find(s => s.value === (field as any).surgery_name)
                        
                        // Get surgery name - never show UUID
                        const surgeryName = surgery?.label || ((field as any).surgery_name && !isUUID((field as any).surgery_name) ? (field as any).surgery_name : "N/A")
                        // Get eye label - never show UUID
                        const eyeLabel = eye?.label || ((field as any).eye && !isUUID((field as any).eye) ? (field as any).eye : 'N/A')
                        
                        return (
                          <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-3 mb-2 shadow-sm flex justify-between items-center">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 mb-1">
                                {surgeryName}
                              </div>
                              <div className="text-xs text-gray-500 space-x-2">
                                <span>{eyeLabel}</span>
                                {(field as any).anesthesia && <span>• {(field as any).anesthesia}</span>}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSurgery(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Surgery Remarks Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Surgery Remarks</label>
                  </div>
                  <FormField
                    control={form.control}
                    name="surgery_remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="Enter surgery remarks..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
                  </div>
                </div>
              </Tabs>
            </div>

            {/* SECTION 3: Fixed Footer (Global Navigation) */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 flex justify-between items-center">
              {/* Left Side - Navigation */}
              <button
                type="button"
                onClick={() => {
                  const currentIndex = steps.findIndex((s) => s.id === currentStep)
                  if (currentIndex > 0) {
                    handleStepChange(steps[currentIndex - 1].id)
                  }
                }}
                disabled={currentStep === "register"}
                className="text-gray-500 hover:text-gray-900 font-medium px-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              {/* Right Side - Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                {(() => {
                  const currentStepNumber = steps.find((s) => s.id === currentStep)?.number || 0
                  return currentStepNumber < 10 ? (
                    <button
                      type="button"
                      onClick={() => {
                        const currentIndex = steps.findIndex((s) => s.id === currentStep)
                        if (currentIndex < steps.length - 1) {
                          handleStepChange(steps[currentIndex + 1].id)
                        }
                      }}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          {mode === "edit" ? "Updating..." : "Saving..."}
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Save Case
                        </>
                      )}
                    </button>
                  )
                })()}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

