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
import { PatientSelectorWithHistory } from "@/components/patient-selector-with-history"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import dynamic from "next/dynamic"

const EyeDrawingTool = dynamic(() => import("@/components/eye-drawing-tool").then(m => m.EyeDrawingTool), { ssr: false })

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
  
  // 9. Diagnostic Tests
  iop_right: z.string().optional(),
  iop_left: z.string().optional(),
  sac_test: z.string().optional(),
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

  // State for surgery form inputs
  const [newSurgeryEye, setNewSurgeryEye] = React.useState("")
  const [newSurgeryName, setNewSurgeryName] = React.useState("")
  const [newSurgeryAnesthesia, setNewSurgeryAnesthesia] = React.useState("")
  
  // State for diagnostic test form inputs
  const [newTestId, setNewTestId] = React.useState("")
  const [newTestEye, setNewTestEye] = React.useState("")
  const [newTestType, setNewTestType] = React.useState("")
  const [newTestProblem, setNewTestProblem] = React.useState("")
  const [newTestNotes, setNewTestNotes] = React.useState("")
  
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
        blood_tests: [],
        treatments: [],
        right_eye_diagram: "",
        left_eye_diagram: "",
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
        blood_tests: [],
        treatments: [],
        right_eye_diagram: "",
        left_eye_diagram: "",
      })
      // Clear selected patient
      setSelectedPatient(null)
      // Reset to first step
      setCurrentStep("register")
    }
  }, [open, mode, form])

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
            className={`w-full justify-between border-gray-300 text-left font-normal ${!value && 'text-muted-foreground'} ${className || ''}`}
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
    if (mode === "edit" && caseData && caseData.treatments && Array.isArray(caseData.treatments)) {
      // Transform treatments array to medicines format
      const transformedMedicines = caseData.treatments.map((treatment: any) => ({
        drug_name: treatment.drug_id,  // Map drug_id to drug_name (both are UUIDs)
        eye: treatment.eye,
        dosage: treatment.dosage_id,   // Map dosage_id to dosage (both are UUIDs)
        route: treatment.route_id,     // Map route_id to route (both are UUIDs)
        duration: treatment.duration,
        quantity: treatment.quantity
      }))
      // Set medicines field with transformed data
      form.setValue('medicines', transformedMedicines)
    }
  }, [mode, caseData, form])

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
  const handleAddMedicine = () => {
    // Require only essential fields: drug, eye, and dosage
    if (newMedicineDrug && newMedicineEye && newMedicineDosage) {
      appendMedicine({
        drug_name: newMedicineDrug,
        eye: newMedicineEye,
        dosage: newMedicineDosage,
        route: newMedicineRoute,
        duration: newMedicineDuration,
        quantity: newMedicineQuantity,
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
        complaints: values.complaints?.map((c: any) => ({
          complaintId: c.complaintId, // UUID from grouped dropdown
          categoryId: c.categoryId || null, // Category UUID from grouped dropdown
          eye: c.eye || undefined, // UUID from eye dropdown
          duration: c.duration || undefined,
          notes: c.notes || undefined
        })) || [],
        
        // Transform medicines (advice) array - values are already UUIDs
        treatments: values.medicines?.map((m: any) => ({
          drug_id: m.drug_name, // Already a UUID from dropdown
          dosage_id: m.dosage || undefined, // Already a UUID from dropdown
          route_id: m.route || undefined, // Already a UUID from dropdown
          eye: m.eye || undefined, // Already a UUID from dropdown
          duration: m.duration || undefined,
          quantity: m.quantity || undefined
        })) || [],
        
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
          surgeries: values.surgeries?.map((s: any) => ({
            eye: s.eye, // Already a UUID from dropdown
            surgery_name: s.surgery_name, // Already a UUID from dropdown
            anesthesia: s.anesthesia
          })) || [],
          diagrams: {
            right: values.right_eye_diagram || undefined,
            left: values.left_eye_diagram || undefined
          }
        },
        
        // Diagnostic tests - combine manual tests with structured diagnostic_tests
        diagnostic_tests: [
          // Include structured diagnostic tests from the form
          ...(values.diagnostic_tests?.map((t: any) => ({
            test_id: t.test_id, // UUID from dropdown
            eye: t.eye || undefined,
            type: t.type || undefined,
            problem: t.problem || undefined,
            notes: t.notes || undefined
          })) || []),
          // Note: IOP and SAC tests should be added via the diagnostic_tests form
          // The fields iop_right, iop_left, and sac_test are deprecated
          // Remove the backward compatibility code that was adding invalid test_id strings
        ],
        
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Case" : "Add New Case"} - Multi-Step Registration</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update case information" : "Complete patient case registration with medical examination"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentStep} onValueChange={(value) => {
              // Allow free navigation between tabs without validation
              setCurrentStep(value)
            }} className="w-full">
              <TabsList className="h-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 w-full p-1 gap-1">
                {steps.map((step) => (
                  <TabsTrigger key={step.id} value={step.id} className="text-xs px-2 py-2 whitespace-nowrap">
                    <span className="hidden lg:inline">{step.number}. </span>{step.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <div className="min-h-[400px] mt-4">
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Add patient past treatments</div>
                    <Button type="button" className="bg-blue-500 hover:bg-blue-600" onClick={() => appendTreatment({ treatment: "", years: "" })}>
                      Add Treatment
                    </Button>
                  </div>

                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">TREATMENT</th>
                          <th className="text-left p-3 text-sm font-medium">YEARS</th>
                          <th className="text-left p-3 text-sm font-medium">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {treatmentFields.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center p-8 text-muted-foreground text-sm">No treatments added.</td>
                          </tr>
                        ) : (
                          treatmentFields.map((fieldItem, index) => (
                            <tr key={fieldItem.id}>
                              <td className="p-3">
                                <FormField
                                  control={form.control}
                                  name={`past_history_treatments.${index}.treatment` as const}
                                  render={({ field }) => (
                                    <SearchableSelect
                                      options={masterData.data.treatments}
                                      value={field.value}
                                      onValueChange={field.onChange}
                                      placeholder="Select treatment"
                                      searchPlaceholder="Search treatments..."
                                      emptyText="No treatments found."
                                      loading={masterData.loading.treatments}
                                    />
                                  )}
                                />
                              </td>
                              <td className="p-3">
                                <Input
                                  placeholder="e.g. 2 Years"
                                  {...form.register(`past_history_treatments.${index}.years` as const)}
                                />
                              </td>
                              <td className="p-3">
                                <Button type="button" variant="outline" onClick={() => removeTreatment(index)}>
                                  Remove
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Medicine Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Medicine</h4>
                    <Button type="button" className="bg-blue-500 hover:bg-blue-600" onClick={() => appendPastMedicine({ medicine_name: "", type: "", advice: "", duration: "", eye: "R" })}>
                      Add Medicine
                    </Button>
                  </div>

                  {/* Medicines Table */}
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">EYE</th>
                          <th className="text-left p-3 text-sm font-medium">MEDICINE NAME</th>
                          <th className="text-left p-3 text-sm font-medium">TYPE</th>
                          <th className="text-left p-3 text-sm font-medium">ADVICE</th>
                          <th className="text-left p-3 text-sm font-medium">DURATION</th>
                          <th className="text-left p-3 text-sm font-medium">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medicineFields.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center p-8 text-muted-foreground text-sm">No medicines added.</td>
                          </tr>
                        ) : (
                          medicineFields.map((fieldItem, index) => (
                            <tr key={fieldItem.id}>
                              <td className="p-3">
                                <Select
                                  value={form.watch(`past_history_medicines.${index}.eye` as const)}
                                  onValueChange={(value) => form.setValue(`past_history_medicines.${index}.eye` as const, value as "R" | "L" | "B")}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="R">Right</SelectItem>
                                    <SelectItem value="L">Left</SelectItem>
                                    <SelectItem value="B">Both</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-3">
                                <FormField
                                  control={form.control}
                                  name={`past_history_medicines.${index}.medicine_name` as const}
                                  render={({ field }) => (
                                    <SearchableSelect
                                      options={masterData.data.medicines}
                                      value={field.value}
                                      onValueChange={field.onChange}
                                      placeholder="Select medicine"
                                      searchPlaceholder="Search medicines..."
                                      emptyText="No medicines found."
                                      loading={masterData.loading.medicines}
                                    />
                                  )}
                                />
                              </td>
                              <td className="p-3">
                                <FormField
                                  control={form.control}
                                  name={`past_history_medicines.${index}.type` as const}
                                  render={({ field }) => (
                                    <SearchableSelect
                                      options={masterData.data.dosages}
                                      value={field.value}
                                      onValueChange={field.onChange}
                                      placeholder="Select dosage"
                                      searchPlaceholder="Search dosages..."
                                      emptyText="No dosages found."
                                      loading={masterData.loading.dosages}
                                    />
                                  )}
                                />
                              </td>
                              <td className="p-3">
                                <Input placeholder="Advice" {...form.register(`past_history_medicines.${index}.advice` as const)} />
                              </td>
                              <td className="p-3">
                                <Input placeholder="Duration" {...form.register(`past_history_medicines.${index}.duration` as const)} />
                              </td>
                              <td className="p-3">
                                <Button type="button" variant="outline" onClick={() => removePastMedicine(index)}>
                                  Remove
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="complaints" className="space-y-6 min-h-[350px]">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Complaints</h3>
                </div>

                {/* Add Complaint Form */}
                <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
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
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddComplaint}
                    disabled={!newComplaintId}
                  >
                    Add Complaint
                  </Button>
                </div>

                {/* Complaints Table */}
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">COMPLAINT</th>
                        <th className="text-left p-3 text-sm font-medium">EYE</th>
                        <th className="text-left p-3 text-sm font-medium">DURATION</th>
                        <th className="text-left p-3 text-sm font-medium">NOTES</th>
                        <th className="text-left p-3 text-sm font-medium">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaintFields.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center p-8 text-muted-foreground text-sm">
                            No complaints added.
                          </td>
                        </tr>
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
                          
                          return (
                            <tr key={field.id} className="border-b">
                              <td className="p-3 text-sm">{complaint?.name || (field as any).complaintId}</td>
                              <td className="p-3 text-sm">{eyeOption?.label || (field as any).eye || '-'}</td>
                              <td className="p-3 text-sm">{(field as any).duration || '-'}</td>
                              <td className="p-3 text-sm max-w-xs truncate" title={(field as any).notes}>
                                {(field as any).notes || '-'}
                              </td>
                              <td className="p-3 text-sm">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeComplaint(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

              </TabsContent>

              <TabsContent value="vision" className="space-y-6 min-h-[350px]">
                {/* Vision Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-semibold text-md">VISION</h4>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 w-1/3"></th>
                          <th className="text-center p-3 border-l font-medium">RIGHT EYE</th>
                          <th className="text-center p-3 border-l font-medium">LEFT EYE</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-3 font-medium text-sm">VISUAL ACUITY (UNAIDED) (VP)</td>
                          <td className="p-3 border-l">
                            <FormField control={form.control} name="visual_acuity_unaided_right" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="Select VP"
                                className="h-9"
                              />
                            )} />
                          </td>
                          <td className="p-3 border-l">
                            <FormField control={form.control} name="visual_acuity_unaided_left" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="Select VP"
                                className="h-9"
                              />
                            )} />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3 font-medium text-sm">PIN-HOLE (VP)</td>
                          <td className="p-3 border-l">
                            <FormField control={form.control} name="pinhole_right" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="Select VP"
                                className="h-9"
                              />
                            )} />
                          </td>
                          <td className="p-3 border-l">
                            <FormField control={form.control} name="pinhole_left" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="Select VP"
                                className="h-9"
                              />
                            )} />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3 font-medium text-sm">VISUAL ACUITY (AIDED) (VP)</td>
                          <td className="p-3 border-l">
                            <FormField control={form.control} name="visual_acuity_aided_right" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="Select VP"
                                className="h-9"
                              />
                            )} />
                          </td>
                          <td className="p-3 border-l">
                            <FormField control={form.control} name="visual_acuity_aided_left" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="Select VP"
                                className="h-9"
                              />
                            )} />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3 font-medium text-sm">NEAR VISUAL</td>
                          <td className="p-3 border-l">
                            <FormField control={form.control} name="near_visual_right" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="Select VP"
                                className="h-9"
                              />
                            )} />
                          </td>
                          <td className="p-3 border-l">
                            <FormField control={form.control} name="near_visual_left" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="Select VP"
                                className="h-9"
                              />
                            )} />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Refraction Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-semibold text-md">REFRACTION</h4>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 w-24"></th>
                          <th colSpan={4} className="text-center p-2 border-l font-medium">RIGHT EYE</th>
                          <th colSpan={4} className="text-center p-2 border-l font-medium">LEFT EYE</th>
                        </tr>
                        <tr className="border-b text-xs text-muted-foreground">
                          <th className="text-left p-2"></th>
                          <th className="text-center p-2 border-l">SPH</th>
                          <th className="text-center p-2">CYL</th>
                          <th className="text-center p-2">AXIS</th>
                          <th className="text-center p-2">VA</th>
                          <th className="text-center p-2 border-l">SPH</th>
                          <th className="text-center p-2">CYL</th>
                          <th className="text-center p-2">AXIS</th>
                          <th className="text-center p-2">VA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Distant Row */}
                        <tr className="border-b">
                          <td className="p-2 font-medium text-sm">Distant</td>
                          <td className="p-2 border-l">
                            <FormField control={form.control} name="refraction_distant_sph_right" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. -2.25" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_distant_cyl_right" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. -0.5" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_distant_axis_right" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. 180" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_distant_va_right" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="VP"
                                className="h-8 text-xs"
                              />
                            )} />
                          </td>
                          <td className="p-2 border-l">
                            <FormField control={form.control} name="refraction_distant_sph_left" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. -2.25" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_distant_cyl_left" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. -0.5" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_distant_axis_left" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. 180" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_distant_va_left" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="VP"
                                className="h-8 text-xs"
                              />
                            )} />
                          </td>
                        </tr>

                        {/* Near Row */}
                        <tr className="border-b">
                          <td className="p-2 font-medium text-sm">Near</td>
                          <td className="p-2 border-l">
                            <FormField control={form.control} name="refraction_near_sph_right" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. -2.25" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_near_cyl_right" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. -0.5" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_near_axis_right" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. 180" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_near_va_right" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="VP"
                                className="h-8 text-xs"
                              />
                            )} />
                          </td>
                          <td className="p-2 border-l">
                            <FormField control={form.control} name="refraction_near_sph_left" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. -2.25" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_near_cyl_left" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. -0.5" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_near_axis_left" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. 180" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_near_va_left" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="VP"
                                className="h-8 text-xs"
                              />
                            )} />
                          </td>
                        </tr>

                        {/* PG Row */}
                        <tr className="border-b">
                          <td className="p-2 font-medium text-sm">PG</td>
                          <td className="p-2 border-l">
                            <FormField control={form.control} name="refraction_pg_sph_right" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. -2.25" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_pg_cyl_right" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. -0.5" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_pg_axis_right" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. 180" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_pg_va_right" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="VP"
                                className="h-8 text-xs"
                              />
                            )} />
                          </td>
                          <td className="p-2 border-l">
                            <FormField control={form.control} name="refraction_pg_sph_left" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. -2.25" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_pg_cyl_left" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. -0.5" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_pg_axis_left" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="e.g. 180" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                          <td className="p-2">
                            <FormField control={form.control} name="refraction_pg_va_left" render={({ field }) => (
                              <SimpleCombobox
                                options={masterData.data.visualAcuity || []}
                                value={field.value || ""}
                                onChange={(value) => field.onChange(value)}
                                placeholder="VP"
                                className="h-8 text-xs"
                              />
                            )} />
                          </td>
                        </tr>

                        {/* Purpose Row */}
                        <tr className="border-b">
                          <td className="p-2 font-medium text-sm">Purpose</td>
                          <td colSpan={8} className="p-2 border-l">
                            <FormField control={form.control} name="refraction_purpose" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="Constant Use" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                        </tr>

                        {/* Quality Row */}
                        <tr className="border-b">
                          <td className="p-2 font-medium text-sm">Quality</td>
                          <td colSpan={8} className="p-2 border-l">
                            <FormField control={form.control} name="refraction_quality" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                        </tr>

                        {/* Remark Row */}
                        <tr>
                          <td className="p-2 font-medium text-sm">Remark</td>
                          <td colSpan={8} className="p-2 border-l">
                            <FormField control={form.control} name="refraction_remark" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                            )} />
                          </td>
                        </tr>
                      </tbody>
                    </table>
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

                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="font-medium text-sm">EYELIDS</div>
                    <FormField
                      control={form.control}
                      name="eyelids_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Right Eye" {...field} />
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
                            <Input placeholder="Left Eye" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="font-medium text-sm">CONJUNCTIVA</div>
                    <FormField
                      control={form.control}
                      name="conjunctiva_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Right Eye" {...field} />
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
                            <Input placeholder="Left Eye" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="font-medium text-sm">CORNEA</div>
                    <FormField
                      control={form.control}
                      name="cornea_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Right Eye" {...field} />
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
                            <Input placeholder="Left Eye" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="font-medium text-sm">ANTERIOR CHAMBER</div>
                    <FormField
                      control={form.control}
                      name="anterior_chamber_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Right Eye" {...field} />
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
                            <Input placeholder="Left Eye" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="font-medium text-sm">IRIS</div>
                    <FormField
                      control={form.control}
                      name="iris_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Right Eye" {...field} />
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
                            <Input placeholder="Left Eye" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="font-medium text-sm">LENS</div>
                    <FormField
                      control={form.control}
                      name="lens_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Right Eye" {...field} />
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
                            <Input placeholder="Left Eye" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="anterior_remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>REMARKS</FormLabel>
                        <FormControl>
                          <Input placeholder="REMARKS" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Posterior Segment */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-semibold text-md">POSTERIOR SEGMENT</h4>
                  </div>

                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="font-medium text-sm">VITREOUS</div>
                    <FormField
                      control={form.control}
                      name="vitreous_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Right Eye" {...field} />
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
                            <Input placeholder="Left Eye" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="font-medium text-sm">DISC</div>
                    <FormField
                      control={form.control}
                      name="disc_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Right Eye" {...field} />
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
                            <Input placeholder="Left Eye" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="font-medium text-sm">RETINA</div>
                    <FormField
                      control={form.control}
                      name="retina_right"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Right Eye" {...field} />
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
                            <Input placeholder="Left Eye" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="posterior_remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>REMARKS</FormLabel>
                        <FormControl>
                          <Input placeholder="REMARKS" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="blood" className="space-y-4 min-h-[350px]">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Blood Investigation</h3>
                </div>
                
                          <div className="grid grid-cols-4 gap-4">
                            {/* Column 1 */}
                            <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="cbc" className="h-4 w-4" />
                      <label htmlFor="cbc" className="text-sm">CBC</label>
                                </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="rbs" className="h-4 w-4" />
                      <label htmlFor="rbs" className="text-sm">RBS</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="hbsag" className="h-4 w-4" />
                      <label htmlFor="hbsag" className="text-sm">HBSAg</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="canca" className="h-4 w-4" />
                      <label htmlFor="canca" className="text-sm">C-ANCA</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="t3t4" className="h-4 w-4" />
                      <label htmlFor="t3t4" className="text-sm">T3 , T4, TSH, ANTI TPO</label>
                    </div>
                            </div>

                            {/* Column 2 */}
                            <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="bt" className="h-4 w-4" />
                      <label htmlFor="bt" className="text-sm">BT</label>
                                </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="fbs" className="h-4 w-4" />
                      <label htmlFor="fbs" className="text-sm">FBS</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="hcv" className="h-4 w-4" />
                      <label htmlFor="hcv" className="text-sm">HCV</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="csr" className="h-4 w-4" />
                      <label htmlFor="csr" className="text-sm">CSR</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="screatinine" className="h-4 w-4" />
                      <label htmlFor="screatinine" className="text-sm">S.CREATININE</label>
                    </div>
                            </div>

                            {/* Column 3 */}
                            <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="ct" className="h-4 w-4" />
                      <label htmlFor="ct" className="text-sm">CT</label>
                                </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="ppbbs" className="h-4 w-4" />
                      <label htmlFor="ppbbs" className="text-sm">PPBBS</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="anaprofile" className="h-4 w-4" />
                      <label htmlFor="anaprofile" className="text-sm">ANA-PROFILE</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="crp" className="h-4 w-4" />
                      <label htmlFor="crp" className="text-sm">CRP</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="ssodium" className="h-4 w-4" />
                      <label htmlFor="ssodium" className="text-sm">S. SODIUM LEVELS</label>
                    </div>
                            </div>

                            {/* Column 4 */}
                            <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="ipinr" className="h-4 w-4" />
                      <label htmlFor="ipinr" className="text-sm">IP-INR</label>
                                </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="hiv" className="h-4 w-4" />
                      <label htmlFor="hiv" className="text-sm">HIV</label>
                            </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="panca" className="h-4 w-4" />
                      <label htmlFor="panca" className="text-sm">P-ANCA</label>
                          </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="rafactor" className="h-4 w-4" />
                      <label htmlFor="rafactor" className="text-sm">R.A FACTOR</label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="diagnosis" className="space-y-6 min-h-[350px]">
                <h3 className="font-semibold text-lg">8. Diagnosis & Tests</h3>
                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnosis</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={(masterData.data.diagnosis || []).map(d => ({
                            value: d.value,
                            label: d.label
                          }))}
                          value={field.value as any}
                          onValueChange={field.onChange}
                          placeholder="Search and select diagnosis"
                          searchPlaceholder="Search diagnoses..."
                        />
                      </FormControl>
                      <FormMessage />
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
                          name="sac_test"
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
                          name="sac_test"
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
                            
                            return (
                              <tr key={field.id} className="border-b">
                                <td className="p-3 text-sm">{test?.label || (field as any).test_id}</td>
                                <td className="p-3 text-sm">{eyeOption?.label || (field as any).eye || '-'}</td>
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Advice</h3>
                  </div>

                  {/* Add Drug Form */}
                  <div className="grid grid-cols-7 gap-3 items-end">
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
                      <label className="text-sm font-medium">Eye</label>
                      <SimpleCombobox
                        options={(masterData.data.eyeSelection || [])}
                        value={newMedicineEye}
                        onChange={(value) => setNewMedicineEye(value)}
                        placeholder="Select eye"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Dosage</label>
                      <SimpleCombobox
                        options={(masterData.data.dosages || [])}
                        value={newMedicineDosage}
                        onChange={(value) => setNewMedicineDosage(value)}
                        placeholder="Select dosage"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Route</label>
                      <SimpleCombobox
                        options={(masterData.data.routes || [])}
                        value={newMedicineRoute}
                        onChange={(value) => setNewMedicineRoute(value)}
                        placeholder="Select route"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Duration</label>
                      <Input
                        placeholder="Select days"
                        value={newMedicineDuration}
                        onChange={(e) => setNewMedicineDuration(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Qty</label>
                      <Input
                        placeholder="Select Qty"
                        value={newMedicineQuantity}
                        onChange={(e) => setNewMedicineQuantity(e.target.value)}
                      />
                    </div>
                    <Button type="button" onClick={handleAddMedicine}>
                      Add
                    </Button>
                  </div>

                  {/* Drugs Table */}
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">DRUG NAME</th>
                          <th className="text-left p-3 text-sm font-medium">EYE</th>
                          <th className="text-left p-3 text-sm font-medium">DOSAGE</th>
                          <th className="text-left p-3 text-sm font-medium">ROUTE</th>
                          <th className="text-left p-3 text-sm font-medium">DURATION</th>
                          <th className="text-left p-3 text-sm font-medium">QTY</th>
                          <th className="text-left p-3 text-sm font-medium">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medicineAdviceFields.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center p-8 text-muted-foreground text-sm">
                              No medicines added.
                            </td>
                          </tr>
                        ) : (
                          medicineAdviceFields.map((field, index) => {
                            // Resolve UUIDs to display names
                            const drug = masterData.data.medicines?.find(m => m.value === (field as any).drug_name)
                            const eye = masterData.data.eyeSelection?.find(e => e.value === (field as any).eye)
                            const dosage = masterData.data.dosages?.find(d => d.value === (field as any).dosage)
                            const route = masterData.data.routes?.find(r => r.value === (field as any).route)
                            
                            return (
                              <tr key={field.id}>
                                <td className="p-3 text-sm">{drug?.label || (field as any).drug_name}</td>
                                <td className="p-3 text-sm">{eye?.label || (field as any).eye}</td>
                                <td className="p-3 text-sm">{dosage?.label || (field as any).dosage || '-'}</td>
                                <td className="p-3 text-sm">{route?.label || (field as any).route || '-'}</td>
                                <td className="p-3 text-sm">{(field as any).duration || '-'}</td>
                                <td className="p-3 text-sm">{(field as any).quantity || '-'}</td>
                                <td className="p-3 text-sm">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMedicine(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    Remove
                                  </Button>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Surgery Details Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Surgery Details</h3>
                  </div>

                  {/* Add Surgery Form */}
                  <div className="grid grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="text-sm font-medium">Eye</label>
                      <SimpleCombobox
                        options={masterData.data.eyeSelection || []}
                        value={newSurgeryEye}
                        onChange={(value) => setNewSurgeryEye(value)}
                        placeholder="Select eye"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Surgery Name</label>
                      <SimpleCombobox
                        options={masterData.data.surgeries || []}
                        value={newSurgeryName}
                        onChange={(value) => setNewSurgeryName(value)}
                        placeholder="Select surgery"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Anesthesia</label>
                      <Input
                        placeholder="Enter anesthesia"
                        value={newSurgeryAnesthesia}
                        onChange={(e) => setNewSurgeryAnesthesia(e.target.value)}
                      />
                    </div>
                    <Button type="button" onClick={handleAddSurgery}>
                      Add
                    </Button>
                  </div>

                  {/* Surgery Table */}
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">EYE</th>
                          <th className="text-left p-3 text-sm font-medium">SURGERY NAME</th>
                          <th className="text-left p-3 text-sm font-medium">ANESTHESIA</th>
                          <th className="text-left p-3 text-sm font-medium">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {surgeryFields.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center p-8 text-muted-foreground text-sm">
                              No surgery details added.
                            </td>
                          </tr>
                        ) : (
                          surgeryFields.map((field, index) => {
                            // Resolve UUIDs to display names
                            const eye = masterData.data.eyeSelection?.find(e => e.value === (field as any).eye)
                            const surgery = masterData.data.surgeries?.find(s => s.value === (field as any).surgery_name)
                            
                            return (
                              <tr key={field.id}>
                                <td className="p-3 text-sm">{eye?.label || (field as any).eye}</td>
                                <td className="p-3 text-sm">{surgery?.label || (field as any).surgery_name}</td>
                                <td className="p-3 text-sm">{(field as any).anesthesia || '-'}</td>
                                <td className="p-3 text-sm">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSurgery(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    Remove
                                  </Button>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Remarks Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Remarks</label>
                  </div>
                  <FormField
                    control={form.control}
                    name="advice_remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            rows={4} 
                            placeholder="Enter remarks..." 
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
            </Tabs>

            <DialogFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const currentIndex = steps.findIndex((s) => s.id === currentStep)
                  if (currentIndex > 0) {
                    setCurrentStep(steps[currentIndex - 1].id)
                  }
                }}
                disabled={currentStep === "register"}
              >
                Previous
              </Button>
              <div className="flex gap-2">
                {currentStep !== "advice" ? (
                  <Button
                    type="button"
                    onClick={() => {
                      const currentIndex = steps.findIndex((s) => s.id === currentStep)
                      if (currentIndex < steps.length - 1) {
                        setCurrentStep(steps[currentIndex + 1].id)
                      }
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          {mode === "edit" ? "Updating..." : "Saving..."}
                        </>
                      ) : (
                        mode === "edit" ? "Update Case" : "Save Case"
                      )}
                    </Button>
                  </>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

