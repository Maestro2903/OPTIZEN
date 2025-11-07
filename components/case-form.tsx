"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
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

// Options sourced from user-provided lists
const COMPLAINT_OPTIONS = [
  "Detail","foreignbody sensation","dimness of vision","diplopia","SUDDEN LOSS OF VISION","FLASHES OF LIGHT",
  "REDNESS OF EYES","STIKENESS","HEADACHE","ITHCING IN EYES","BLEPHAROSPASM","FOREIGN BODY IN EYE",
  "PTOSIS","Iridocyclitis","IOP","I CARE IOP","Right Eye","Left Eye","Both Eye","Complaints",
  "Itching Of Eye","Sudden Loss of Vision","Redness of Eyes","Stikeness and Discharge","Blepharospasm",
  "Foreign Body in Eye","Ptosis","Iridocyclitis","Itching of Eye","Headache","Fundus","Diabetic Retinopathy",
  "Maculopathy","NAD","Haemorrage","Glucoma","Optic Atrophy","0.5 cup","0.6 cup","0.7 cup","0.8 cup","0.9 cup",
  "Pachy","NCT","NO","Burning of Eyes","Watering of Eyes","Foreignbody Sensation","Dimness of Vision","Diplopia",
  "0.6 Cupping","0.8 Cupping","AMRD","Drussen","No Diabitic Retinopathy","DONE","TOPO DONE","A SCAN DONE","DILATE",
  "TORIC FIT","LEFT EYE","POST LASIK","Dryness of eyes","OCT DONE","Old R D","Old RD","PERIMETRY DONE","Asteroid Hylosis",
  "Dry AMD","Lid Edema","CORNEA","Subepithelial Infilitrate","Flashes of Light","YAG LASER DONE","Pain","CME",
  "Myopic Deganretion","Venous Toruosity","Dimness of vision","Vitreous Floaters","Disc and Macula appear normal",
  "Within normal limits","Fine ERM over Macula","PVD noted","Myopic Fundus","Chorioretinal Patch On Macula",
  "BE white without pressure areas in peripherial retina","Routine eye check up","Routine Eye Checkup","Ciliary Congestion",
  "KPs,Flare,Cells,","Iris Nodules","Koppes's Nodules","Posterior Synechiae","Irregular Pupil","Fibrinous exudate",
  "GAT IOP","NCT IOP","SCLERITIS","Pseudomembrane Formation","Diffuse","Nodular","Sclero - Uveitis","Sclero - Keratitis",
  "Conjunctiva","Papillary Hyperplasia","Cobblestone Appearance","Pigmentation of Conjunctiva","Lattice Degeneration",
  "Inferior Notch","Superior Notch","Peripallary Atrophy","Heavyness","CNVM","Atrophic Patch around the Macula","PVD",
  "FINT SEEN","Limbal thickning","Conjuctival pigmentation","Mucoid Discharge","Periocular Pigmentation","Swelling Arount the eye",
  "Pain, Redness","Watch sign for Pain on eye movment","Swelling around eye","Redness,Dimness of vision,Headache",
  "Vitreomacular traction","Macular Odema","Multiple retinal heamorrahges with hard exudates over macula","Inferior Lattice",
  "Post operative","BE- Tessellated Fundus","Proliferative diabetic retinopathy","Non Proliferative diabetic retinopathy",
  "For LASIK","No peripheral retinal lesions noted","Pterygium","LMH- lamellar macular hole","Night time Glair","Limbitis",
  "Congestion","Next visit Dilate For refrection","Corneal Degeneration","Salzmanns Nodules","post lasik epithelial ingrowth.",
  "sevire MGD","Para centeral Corneal Irregularity","Choroidal Coloboma",
  "Small UL stye(no tenderness)Diffuse congestision , endothelial dusting+, AC appears quiet,  lens clear","Lid Margin keratinization +",
  "IRIS","Koeppe's Nodules","Busacca's Nodules","Large Physiological Cup","ANTERIOR SEGMENT WNL","BE- Papilloedema","Guttae",
  "Punctate epithelial erosions","Opacity","Ulcer","Infiltrate","Abscess","Thinning","Vascularisation","Oedema",
  "Microcystic oedema","DM folds","Striate keratopathy","Degeneration","Dystrophy","Chronic CME","Capsular Phirmosis",
  "CONCRETION","Colour Vision Normal","Exophthalmos","EXOPHORIA","Floater","Limbitis","hypopyon","AC cells+",
  "Ocular movements normal","Congenital NLD Block","Papillae+","Conjunctival congestion","Anterior Segment Normal",
  "Peripheral Retina Not Seen","Conjunctival congestion ++, Discharge+, Follicles+","No Hypertensive Retinopathy",
]

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

const VISUAL_ACUITY_OPTIONS = [
  "6/4P","6/5P","6/6P","6/9P","6/6","6/9","6/12","6/18","6/36","6/60","FC 1M","FC 1/2M",
  "FC CLOSE TO FACE","FC 3M","HAND MOVEMENTS","PL+ PR INACURATE","PL+ PR ACURATE","6/12P","6/18P","6/24P",
  "6/36P","6/60P","FIXING","NO PL","N/6","N/8","N/10","N/12","N/18","N/24"
]

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

const MEDICINE_OPTIONS = [
  "ACUPAT EYE DROP","LOTEL LS EYE DROP","Norzen eye drops","Ciplox eye drops","Zoxan eye drops","Cifran eye drops",
  "Diamox Tablet (250 mg)","Betnesol-N Eye drops","Dexament-N Eye Drops","Tropicacyl Plus Eye Drops","Cyclomid Eye Drops",
  "Tropicamet Plus Eye Drops","Atropine Eye Drops","Atropine Eye Ointment","Zofenax Eye Drops","Dicloran Eye Drops",
  "Brufen (200 mg) Tablet","Brufen (400 mg) Tablet","Kinetone Capsule","Nuclav (375 mg) Tablet","Nausidome Tablet",
  "Digene Tablet","Digene Gel","Tablet Deltaflam","Floxigaurd Eye Drops","Pyrimon Eye Drops","Pychlor Eye Drops",
  "Dexament - N Eye Drops","Bleph  Eye Drops","Lacrigel Eye Ointment","Tearplus Eye Drops","Liquiflim Tears",
  "Nudoxy Tablet","Tablet Neurotrat","Osmotek Eye Drops","Moisol Eye Drops","Toba Eye Drops","Genticyin Inj.",
  "Toba - DM Eye Drops","Pilomax  2.0%  Eye Drops","Zoxan Eye Ointment","Ketlur Eye Drops","Vorac Eye Drops",
  "Chlormixin Eye Drops","Chlormixin Eye Ointment","Chlormixin - D Eye Ointment","Timolet Eye Drops 0.5%",
  "Acivir Eye Ointment","Cromal Eye Drops","Ciplox Eye Ointment","Optipress Eye Drops","Optipress - S Eye Drops",
  "Tablet Theragram - M","COMBIGAN EYE DROP","LATACOM","ACUPAT","LOTEL LS","Norzens","Ciplox","Zoxans",
  "Cifrans","Diamox (250 mg)","Betnesol-N","Tropicacyl 1 %","Cyclomids","Tropicamet Pluss","Atropine","Zofenaxs",
  "Diclorans","Brufen (200 mg)","Brufen (400 mg)","Kinetone","Nuclav (375 mg)","Nausidome","Digene","Deltaflam",
  "Floxigaurds","Pyrimons","Pychlors","Dexament - Ns","Bleph s","Lacrigel","Tearpluss","Nudoxy","Neurotrat",
  "Osmoteks","Moisol","Tobas","Genticyin.","TOBA-DM","Pilomax  2.0% s","Zoxan","Ketlurs","Voracs","Chlormixins",
  "Chlormixin","Chlormixin - D","Timolets 0.5%","Acivir","Cromals","Optipresss","Optipress - Ss","Theragram - M",
  "Kenalog - S","Ibugesic(200mg)","Betagan 0.5%s","Scalp Vein Set (No:22)","Glycerol IP","Quinobacts","Ciprodacs",
  "Cadiflurs","Ocupresss","Topcid (20MG)","Zinetac","RANTAC","Odoxil (500MG)","Odoxil (250MG)","Droxyl (250MG)",
  "Crocin","Metacin","Combiflam","Ibugesic Plus","Imol Syrup","Eboo Plus","Vibazine   DT",
  "Dorzox / Brinzagan / Azopt","Dolonex  DT","Flurs","Cortison Kemicetin","Allercroms","Acular-0.5%s",
  "Tropicyl Pluss","Andremides 20 %","Pred Forte/ IO-Pred S","Decol-Ns","Tromacyn s","Cobadex-Z","Bioculas","Phenils",
  "I-Kuls","Vidalyn-M","Kemicetines","Mycidexs","Jonac CRs","Oxigards","Cortisone Kemecitne","Cyclogyl","Atrisolons",
  "TROPINA","Andrecin-P","Adifloxs","CYCLODEX S","KEMICETINE","VIMACAINES","OCUNACS","PARACAINES","SYSCANS",
  "GLUCOMOL 0.5%","TEARS NATURALE II","CIPEYE","COMPLETE STERILE SOLUTION","LIMCE","DECOL - P","ANDRECIN  -PS",
  "TROMADEX","FLUCOMET","INAC-50","IMOL","REDCLOX  KIDS","INAC-TR","INAC-DT","MYCOREST","PRIMAFUCINS",
  "EYEBREXS","REDCLOX","OCUVITS","ZIFERRIN-TRS","LOMIBACTS","LIMCEE","AQUASOL-A","NEUROBION FORTE","OCULONES",
  "JONAC PLUSS","FLUCID-M","NOVIL","INDOFLAM 25 MG","FLOSONES","XALATAN","ALPHAGAN","SUPRADYN","PYCHLOR DEXA",
  "CYCLOGIK 1 %S","I-LUBES","IOTIM 0.5 %","CIPLOX","CONTAZYMES","ANACET-20","DEXOREN-SS","OKACINS",
  "VOVERAN OPHTHAS","PYCHLOR DEXAS","HOT FOMENTATION","EYEVITALS","ALREID","ZYNCET","DUDROPS",
  "OMNACORTIL 10 MG / Wysolone 10mg","COMPLETE ENZYMES","OCUFLURS","LUBRILAC","FEGANS","ZENTILS","Tetracin",
  "Timolet GFS 0.5 %s","Facidaseection","Lomibact 0.3 %s","Toxils","SYMOXYL-LB 250 MG","OPTITHROCIN","I-UBE EYE UNIMS",
  "OCUPOL-DS","FML -T","Azelasts","Hovite Syrup","ZOCONS","Omnacortil (20 Mg) / Wysolone 20mg","TIMOLET PLUSS",
  "OFLOXACINS","TOBDROPS","Iopar-SR","Azithral 250 Mg","OCUPOL","PROPINES","TRIOCYLS","REDCLOX S","OCUCIN",
  "Ocuwets","Scats","Flomexs","Mists","Refresh Tears","SYMOXYL -LB 250 MG","LORMEG","OXYLINS","NATMYET",
  "Pred Mets","CELLUVISC UNIMS","ACTAMIDES","JONAC-PLUS","PREDMETS","LONGACINS","OFLACINS","LATOPROSTS","NEUROBION",
  "EXOCIN","DICULONE","CROMAL FORTS","HYPARSOL-5","PREDACES","PREDFORT / GATIQUIN-P","BRIMOSUN-PS","CYCLOMUNES",
  "MOSS PLUSS","FLAMMER MX","OFELDERS","TEAR DROP","ALBALONS","Moxifresh","FLOGEL","C-MIST","ULTRAFLAM","MOBIZOX",
  "EYEMIST","LUMIGAN","TRAVANTAN","GENTEAL GEL","PENTOLATES","RICHGEL TEARSS","GLUCOMOL ODS","HYPERSOL-6",
  "JUST TEARS","CMPH","WINOLAP","PREDNISOLONES","NEXCARE EYE PATCH","ULTRAGELS","ZADITENS","FLEXON","RELIFS",
  "FLAREX","TIMOLASTS","OCCUMOXS","MYCINS","KETLUR LS","WARM COMPRESSION","MET NEUROBION OD","OCUMOISTS",
  "ACULAR LS","MOXIMUMS","MOXICIP","OFLO","OCUPOL-D","LACRYL PF","ZAHA","LOTEPRED LSS (For 7 Days)","TRAVAXO-T",
  "SYSTANES","NEVANAC","HIFENEC-P","VIGAMOX","TROPICAMET 1%","ESTOCIN","AUGMENTIN DU 625","AMINOGEN","GENTEAL",
  "ATRO","CAREPROST","COLD COMPRESSION","MEGABROMS","APDROPS -LP","NEW BIFLACE","Lacryl Ultra","GATILOXS","MILFLOX",
  "GATIQUINS","R-1500","ZYMAR","KEDS","LOTEL LS ( FOR 7 DAYS ONLY)","TACROZ FORTE","CORTISON OPTICHLOR","LOTEFLAM( FOR 7 DAYS)",
  "KETODROPS LS","AZITHRAL","TEARMAX","OPTIVE","MOXTIF -K","SYSTANE ULTRA","BESIX","VIRSON GEL","LOTERED(FOR 7 DAYS)",
  "AQUASURGE MAX","HIFENEC MR","NEUROBION PLUS","OSMEGAS","T BET","T-1","XOVATRA","ACUVAIL","DOXY-1 L DR FORTE",
  "ALPHAGAN-Z","TRAVACOM","RHYLUB","OPTIVE FUSION","ZYAQUA","OSMODROP","NEPALACT","NEPAFLAM OD","BIDIN LS",
  "REAL TEAR","CPN","CPN PLUS","MEGA CV 625mg","4QUIN DX","TOBA","FMP PLUS","DORZOX-T","DORZOX","MILFLOX DM EYE DROP",
  "COMBIGAN","GANFORT","ALLEGRA 120mg","Rejunex","IOTIM PLUS","FLEXON SYRUP","CONBIFLAM SYRUP","UNIBROM","CETIMET 45mg",
  "PATADAY","VELDROP","EUBRI","PIXELUB MULTI","ALPRAX 0.25 mg","VITCOFOL","4 QUIN LOT","Lotesurge LS","ADOREFLOX-D","CO",
  "CITIMET","LEVOQUIN-500","MANITOL","Harpex","Tab MBSON","Ultracet","AZOPT","ALCAREX","MILFLODEX EYE DROP","MILFODEX",
  "MOSI","Timolet OD","REFRESH LIQUGEL","REFRESH EZZE","ECO TEARS","Microdox-LBX","XALACOM","POLYNASE","LUBREX","IOBRIM",
  "VAIN FLONE (22G)","BIDIN-T","WALYTE CITRO","TOBASTAR","MYTICOM","CHLORODEX","TRAVAXO","L-PRED","ARA GEL","MOSI-DX",
  "LOTEPRED LS","I V SET","BRIMOCOM","NATAMET","HOMIDE","FML","SOFTVISC","B T PRESS","BT PRESS","GLYLENE",
  "BETOACT EYE DROPS","MOXOFT-KTL","MOXIBLU-D","ZYMAR OINTMENT","MOXICIP SINGULES","BRINZAGAN","ARACHITOL-NANO-VIT-D",
  "FLURO","BROMVUE","LOTEMAX","NEUROKIND","NEUROKIND TABLET","OPSION HA","MOXSOFT LP","SIMBRINZA / SYNCA / BRIVEX",
  "UV-LUBE unims","ZYLOPRED","DABFIT","VIGADEXA","ZYMAXID","VISIMOXD EYE DROPS","METHYL PREDNISOLONE","Norma saline 100cc",
  "EMESET","INTRACATH NO -22","Folcer - MP","ZEROFLOX EYE DROP","MILFLOX-DF","AZITHRAL XL SYRUP 200 mg","AQUALUBE",
  "BRINZOMA","MIGRANIL TAB","timolast","MYOPIAN","MYOPIN","VALCIVIR-1000","EUGI SACHETS","SOLINE-5","BRIMOTOPOST",
  "I-KUL PLUS","KETOMAR","Moxicip D","LEVOTAS-500","MAXMOIST","CIBRIM - T","MACUGOLD","PILOCAR 2%","APDROP","GATIQUIN",
  "AMPLINAK","SOFINOX","ZIMIVIR 1000mg","AKILOS-P","MOXISURGE","NTGEL","MOXIFORD","ZYWET","MOXITAK","AQUALUBE PM GEL",
  "NUPINASE","TAB. LIMECHEW","TAB. B-LONG (VIT B6 Piyidoxine)","TRAVISIGHT","ZENTIVIN-D","EYEMAC","A-WAYLABLE","DUOBROM",
  "LATOPROST RT","MOISOL-Z","RELUB EYE DROP","MUPINASE CREAM","DAN-MR","REAL GEL EYE DROP","ultra gel","KITMOX-DX","CATAPRED",
  "ZETHROX 100 XL","BIDIN-LS TM","Hysolub Plus","EYE LID CLEANSER","CLEANSER","BIDIN TM","SOFTDROP","SOFT DROP PM GEL",
  "DOLO 650 TAB","LOTEL 0.5","REBACER","MEDI GRIPN (IV)","Milflodex","TACROLIMUS OINTMENT0.3%","Talimus LS","CYCLOSIGN",
  "Limechew (Vit C 500 MG)","TRAVISIGHT T","MOXTIF","Folcer-FE","MB Vit-12","TALIMUS LS","Alaspan AM","Solumedrol 1 gm",
  "MOXOF-D","DAROLAC","TOBA F","MOXITIF EYE DROP","INDOCAP SR (75 MG)","BRINZOX","EXIX","K G Pure (Powder)","L.O.C",
  "FLUCON","DIFLUCOR","MOXISTAR-D","MILFLOX DF","MILFLODEX","Milflodex Eye Drop","L-Pred EYE DROP","fenix eye drops",
  "AQUIM PF","MILCLAVE 625","NEURO KIND","RHYMOXI EYE DROP","KITOMOX EYE DROP","TEAR DROP GEL","RITCH SOLUTION","MOXI-D",
  "K G  PURE","TOVAXO","BRINOLAR","MENITROL","VEN FLOW 22 G","I- SITE PLUS","EAGLE-(I)","MOSI EYE OINNTEMENT","POLYCHLOR",
  "POLYCHLOR DM","PANTHEGEL","LATOPROST @RT","MILCLAVE 625mg","CLAVAM 625 mg","DIFLUNET EYE DROP","NEO BROM EYE DROP",
  "HYLA","POILYCHLOR OINT","NEW I SITE","MOXICON LP","ENLUBE FUSION","T-BACT (SKIN OINTMENT)","XLHA EYE DROP","LATOCOM-CF",
  "LACRIMS EYE DROP","LACRIM-S","SPORLAC PLUS","LOT LS 0.2%","APDROPS DM","BRIMOSUN EYE DROPS","apdrops PD","MYSTIC BLUE EYE DROP",
  "In case of Redness and Pain,","IOTIM-B EYE DROP","ULTRA GEL EYE DROP","ARA EYE DROP","BRIMOTAS-T EYE DROP","Oculact",
  "DURONET TM EYE DROP","OFLO EYE OINT","REDIF","FLUOCIN","MOXIMUM-D EYEY DROP","NEPATOP EYE DROP","MYATRO EYE DROP",
  "MFC EYE OINTMENT","IO-TRIM EYE OINTMENT","Locula - TR","UV LUBE","Z-BROM EYEDROPS","OLOPAT EYEDROP",
  "Glylene/ Maxmoist Ultra/ Systane Ultra","OMNACORTIL 40MG / Wysolone 40 mg","BRIMITOL EYE DROP","Cibrim Z",
  "Lumigan / Lowprost PF - Eye Drop","SYNCA","Moistane","UTOB-F (Tobramycin)","MBSON-SL","AUROGEL PLUS","BIMAT LS TM",
  "SOHA EYEDROP","NEPCINAC EYE DROP","HYSOLUB","GLYTEARS","ATROSUN","APIDINE-5","LOTEPRED-T","RIPASUDIL","ILEVRO",
  "LACRYL HYDRATE","Ripatec Eye Drops","FRENIX-NT OCULAR LUBRICANT","GATSUN FORTE","BIMAPIX","BIMAT-LS",
  "ONTEARSUNIT DOSE FOR SINGLE USE","VITREON SACHET (SUNWAYS)","PENVIR 500 mg","PREGABA M 75mg","NUROKIND PLUS","PREDMET 16",
  "PAN D 40","FAMOCID 20","DICLORAN A","DICLORAN","EVAFRESH","HYLOFRESH","ADVANCE TEARS","Cafta","SOLINE-6",
  "NATACIN 5% EYE DROP","FLUCOCID EYE DROP","Gancigel Eye Gel","AD BROM FREE EYE DROP","NepaOnce","GLUCOTIM- LA","ON TEARS",
  "B-LONG TAB VITAMIN B6","Sodamint Tablets BP","LUPITROS-Z","immu-CDZ","GATIQUIN-P","Votalube","Systane Gel","ENMOIST Cream",
  "HEAL TEARS","BRIMOLOL","BRIVEX","FDSON","KITOMOX UNIMUS","EVER FRESH","BTCOM","INTAPROST","TEARPRO","HYPOCLIN EYELASH CLEANSER",
  "HYPE-5","EVERA DS MOISTURISING LOTION","DURSON T","DORSUN-T","Neosporin","DORTAS","FAMOCID 40ng","RICHAGE ULTRA",
  "DORSUN","RESYNC","TALIMUS EYE OINTMENT","LIVOGEN Z","MOSI D","MAXMOIST ULTRA","Neofresh Gel","AZARGA","Gate-P","STORVAS 10MG",
  "HYVET","MOXICIP D","Brimodine","SUPRACAL","Nepaflam","ADD TEARS","AUSCIP-D","Brimocom PF","anxit","Kidtro","Gate - P",
  "RELUB","OPTILAC","LOPERAMIDE 2 mg","AZITHROMYCIN 500mg","VOLINI Spray","BETAFREE","Travatan","MBNET SL","Occucom","masaage",
  "Taximo","TAXIM-O","MFLOTASM","MOXIFAR","ADOREMOXI PD","NEPASTAR OD","MAHAFLOX-LP","CAREPROST LS","TEDIBAR","LOTOP",
  "Everacal Lotion","Vertistar 16 MG","Flexidine","ibuqen","ibugesic","Glycerina Cream","Glycerina Bar","Polychlor","NASOCLEAR NASAL DROP @",
  "Lotestar","Ophthapan Gel","Homacid","Inj. Dexona","Lubimoist","Nipasin","Systane Hydration","Ophthapan","BRIMED- T","CHLOROCOL-H",
  "OPTIVIEW-HA","Albrim - T","Aava","Oflox- D","ZOLINE PLUS","Lotimo","ACIVIR 400 MG","TRAVOPROST","SYMHYLO","HYPERSOL",
  "Lacryl Gentle Gel","MOTOGRAM","MOXITAX LP","VCZ Chewable tablet","lotestar-m","DUO-2  EYE DROP","REFFRON","KIDTRO / MYATRO",
  "Tear/Optive","Moxicip / Mosi","Zaha / Azithral","Milflodex / Moxicip D","LOC Tear Fusion","GANFORT /BIMAT- T /CAREPROST PLUS",
  "POTCHLOR","TRAVATAN / TRAVISIGHT / TRAVAXO","TRAVACOM / TRAVISIGHT-T / TRAVAXO-T","XALATAN / LATOPROST RT / 9.00 PM",
  "XALACOM / LATACOM CF /","AZARGA / BIRNZAGAN  / AZOPT","B T PRESS / ALPHAGAN / BRIMOCOM","SYNCA / DUO-2 / SIMBRINZA",
  "DORSUN -T / DORPRESS-T / DORZOX-T","Systane Gel / Glylene","ECO MOIST","Lubistar 0.5%","Ocupol","VERTISTAR 16 mg",
  "Hysolube / Optive","Cyclotears","BRITE TABLET","L Dio 1","BRIO EYE DROPS","BRIOPT","EYESURGE","MOXISURGE-D","HYLOSURG",
  "PESILONE","Amplinak / Nepcinac","Tablet Macugold / Eyesurge / Reffron","LESIQ PRIME","CMC","OLOPINE","NETALO","NORMO TEARS",
  "FIGHTOX FORTE 625mg","D3 VITA NANO SHOTS","Raricap-L syrup","mulmin syrup","Mosight - LP","Inflow Tears","OTRIVIN NASAL DROP",
  "Optihist Bang","Zeredol SP","Moxitak LP","TakeFresh","Amikacin","Occumox","CETRIZINE","LEMOLATE GOLD","OPTIFRRESH",
  "RESTASIS","HYMOIST","Tregmon","LACORT","LOCORT","MEDIDOL SP","PILOCAR","Amphotyericin","Abpress","AUGMENTIN",
  "Tacrolimus","VOZOLE","AMPHOTERICIN B","Linezalid","BRIO-T","ITRAL EYE","Augmentin","Brinzolast","OPCON A","T-Cycline HC",
  "9:00 PM","NAPLOX","TEARBLAS T","TEARBLAST","Timolol","HYLOTEAR","EN-DOR EYE DROP","TRAVOX","Macushield","POTKLOR",
  "MYESTIN 60mg","MOKSHOT","I-PEG PLUS","TEARSTAY PLUS","NEODEX","DORTAS-T","SYSTANE COMPLETE","CEFIXIME 200mg","ACIVIR 800 MG",
  "Stopach","Ocusoothe Duo","Maqvue","DOLO","Lid massage","Zerodol - SP","LOTESURGE(0.5%)","RAIKI","Careprost / Bimapix",
  "NEXPRO-20","E-FLO","BETADINE","Gloeye","Apidine Plus","NATAFORCE","IO-PRED-S","Alphagan P","Trehatod",
  "Flogel / Maxmoist","Simbrinza","Atorvas 20 mg","Calpol","Ripatec T","Awarene PF","Pixelube/ Tear Drop/ Systane Complete",
  "Lubistar 1%","Lowprost PF","Fortified Ceftazidim","Omnacortil 5 mg","Bromsite","Biflace","HOMOCHEK","inj taxim 1 gm",
  "Moxigram Eye Ointment","CAP. PHEXIN 500","IFLOMAX OINTMENT","ZIFI 200","ULTRACET","PD CURE","MOXICON-CV 625","SERNAC",
  "MOXICON CV 625","MFC","MAXSOUL","TAXIM","METROGYL 500","PHEXIN 500","DEXA 2CC","MAXSOUL-D","SOULFRESH","FLUT-T",
  "AXPERT PLUS","RAWCID-DSR","Aspan 40","MOXICON","AQUIM EYE WIPES","ZEFIX","TOBRINE EYE DROP","COMBIPAAR","DEXIMON-PX",
  "CLAVUM 625","NEXTANE EYE WIPES","AQUIM GEL","EYECIRQUE PRO","LEVOCET 5 mg","CHLODEX P","LEVOCET-M Syrup","LEVOCET-M",
  "GENFOUR-DX","ENMOX","Naproxen","RETICHLOR H EYE OINTMENT","Fortified Voriconazole 1%","Fortified Ceftazidime 50 mg/ml",
  "fortified Vancomycin 5%","LOTEPRED EYE DROPS","MEGABROM EYE DROPS","AP EASE","METHYLPREDNISOLONE 1 gm","MEDERMA SCAR CREAM",
  "Tobracid F","Fresheyes Tears","ECOTEARS HA","MOXIGRAM","MOXIGRAM EYE DROPS","GENFOUR-LP","CELIN 500","I SITE PLUS",
  "FLUTICASONE NASAL SPRAY","THIO-ACE","DYNAPAR-QPS SPRAY","DRY SHAMPOO","OTRIVIN PEDIATRIC NASAL SPRAY","BRESOL SYRUP","RESWAS",
  "CONTRACTUBEX  OINTMENT","ENTOD LASH FACTOR","BIOHOMIN TABLET","TERZO SP","IV INJECTION METHYL PREDNISOLONE 500mg","moxigram-lx",
  "ZIVIMOX","ELMOX CV 625 DUO","CATAGON EYE DROPS","EYEMIST FORTE","NAPRA-D","MOFO DX","SOFI RX ULTRA","5-FLUROURACIL 1%",
  "VOTAMOX-D","GATILOX-DM","GENFOUR EYE DROPS","NEPRA- D","METHYLPREDNISOLONE 500mg","MAXIM EYE DROPS","MOVEXX-SP",
  "LOTEPRED 1% EYE DROPS","RAYPOL","BOTRACLOT SOLUTION","ABGEL","3M MICROPORE","VOTAMOX-LP","MOXAM","CLEARVIEW EYE DROPS",
  "SOHA LIQUIGEL","SHELCAL","AQUIM T","PREDFORTE","ENTEROGERMINA SOLUTION","OMEGA 500 CAPSULE","I KUL EYE DROPS","AP REST PLUS",
  "SHELCAL-M","MAXIM L","4 LUB HA Eye drops","CHLORONIX EYE OINTMENT","MOXIGRAM D","CHLOMAX P"
]

const DOSAGE_OPTIONS = [
  "1 TIMES A DAY","1 TIME A DAY FOR ONE WEEK","2 TIMES A DAY","2 TIMES A DAY FOR 45 DAYS","2 TIMES A DAY FOR ONE WEEK",
  "3 TIMES A DAY","3 TIMES A DAY FOR ONE WEEK","4 TIMES A DAY","4 TIMES A DAY FOR ONE WEEK","5 TIMES A DAY","6 TIMES A DAY",
  "ALTERNATIVE DAY TO BE CONTINUED","AT NIGHT","EVERY ONE HOUR","EVERY 10 MINUTES","EVERY 2 HOURS"
]

const SURGERY_OPTIONS = [
  "FOREIGNBODY","GLAUCOMA","ANIRIDIA","COLOBOMA OF IRIS","PTOSIS","BLEPHAROSPASM","CHALAZION","BLEPHARITIS",
  "LENS INDUCED GLAUCOMA","PINGUECULUM","PTERYGIUM","PHLYCTENULAR KERATOCONJUNCTIVITIS","SYMBLEPHARON","MEGALOCORNEA",
  "MICRO CORNEA","KERATOCONUS","CORNEAL ULCER","INTERSTITIAL KERATITIS","RETINO BLASTOMA","ECTOPIA LENTIS",
  "RETINITIS PIGMENTOSA","OPTIC ATROPHY","HORDEOLUM-EXTERNAL","CATARACT IN RIGHT EYE","CATARACT IN LEFT EYE",
  "AMBLYLAOPIA","CORNEAL FOLDS","POOR ENDOTHELIAL COUNT","NLD BLOCK","CATARACT IN BOTH EYE","GLAUCOMMATOUS DAMAGE",
  "CLEAR","Post Subcapsular Cataract","POST POLAR","Cortical Age Related Cataract","NUCLEAR SCL -1","NUCLEAR SCL -2"
]

const caseFormSchema = z.object({
  // 1. Register
  case_no: z.string().min(1, "Case number is required"),
  case_date: z.string().min(1, "Date is required"),
  patient_id: z.string().min(1, "Patient is required"),
  visit_type: z.enum(["First", "Follow-up-1", "Follow-up-2", "Follow-up-3"]),
  
  // 2. Case History
  chief_complaint: z.string().optional(),
  history_present_illness: z.string().optional(),
  
  // 3. Patient History
  past_history: z.string().optional(),
  treatment_history: z.string().optional(),
  family_history: z.string().optional(),
  
  // 4. Complaints
  complaints: z.array(z.string()).optional(),
  
  // 5. Vision & Refraction
  vision_right_eye: z.string().optional(),
  vision_left_eye: z.string().optional(),
  refraction_right: z.string().optional(),
  refraction_left: z.string().optional(),
  
  // 6. Examination
  anterior_exam: z.string().optional(),
  posterior_exam: z.string().optional(),
  
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
  
  // 10. Advice
  medicines: z.string().optional(),
  dosage: z.string().optional(),
  surgery_advised: z.string().optional(),
  treatments: z.array(z.string()).optional(),
  // 11. Diagram
  right_eye_diagram: z.string().optional(),
  left_eye_diagram: z.string().optional(),
})

interface CaseFormProps {
  children: React.ReactNode
  caseData?: any
  mode?: "add" | "edit"
}

export function CaseForm({ children, caseData, mode = "add" }: CaseFormProps) {
  const [open, setOpen] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState("register")

  function SimpleCombobox({
    options,
    value,
    onChange,
    placeholder,
    className,
  }: {
    options: string[]
    value?: string
    onChange: (v: string) => void
    placeholder?: string
    className?: string
  }) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState(value || "")
    const [isTyping, setIsTyping] = React.useState(false)
    
    React.useEffect(() => {
      if (!isTyping) {
        setInputValue(value || "")
      }
    }, [value, isTyping])

    // debounce
    const [debounced, setDebounced] = React.useState(inputValue)
    React.useEffect(() => {
      const t = setTimeout(() => setDebounced(inputValue), 150)
      return () => clearTimeout(t)
    }, [inputValue])

    const filtered = React.useMemo(() => {
      // If user just opened and hasn't typed, show all
      if (!isTyping && open) return options
      const q = (debounced || "").trim().toLowerCase()
      if (!q) return options
      return options.filter((o) => o.toLowerCase().includes(q))
    }, [options, debounced, isTyping, open])

    const [active, setActive] = React.useState(0)
    React.useEffect(() => {
      setActive(0)
    }, [debounced, open])

    const handleSelect = (opt: string) => {
      onChange(opt)
      setInputValue(opt)
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
            <span className="truncate">{value || placeholder || "Select option"}</span>
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
                  key={opt}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                    opt === value || idx === active ? 'bg-gray-100' : ''
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => handleSelect(opt)}
                >
                  {opt}
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
    options: string[]
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
      const q = debounced.trim().toLowerCase()
      if (!q) return options
      return options.filter((o) => o.toLowerCase().includes(q))
    }, [options, debounced])
    const [active, setActive] = React.useState(0)
    React.useEffect(() => setActive(0), [debounced])

    const remove = (item: string) => {
      onChange((values || []).filter((v) => v !== item))
    }

    return (
      <div className="space-y-2 relative">
        <div className="flex flex-wrap gap-2">
          {(values || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No items selected</p>
          ) : null}
          {(values || []).map((v) => (
            <span key={v} className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs">
              {v}
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => remove(v)}>×</button>
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
                    const selected = (values || []).includes(opt)
                    const next = selected ? (values || []).filter((v) => v !== opt) : [...(values || []), opt]
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
                  const selected = (values || []).includes(opt)
                  return (
                    <button
                      type="button"
                      key={opt}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${selected || idx === active ? 'bg-gray-100' : ''}`}
                      onClick={() => {
                        const next = selected
                          ? (values || []).filter((v) => v !== opt)
                          : [...(values || []), opt]
                        onChange(next)
                      }}
                      onMouseEnter={() => setActive(idx)}
                    >
                      {opt}
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

  const form = useForm<z.infer<typeof caseFormSchema>>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: caseData || {
      case_no: "OPT" + new Date().getFullYear() + "001",
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

  function onSubmit(values: z.infer<typeof caseFormSchema>) {
    console.log(values)
    setOpen(false)
    form.reset()
  }

  const steps = [
    { id: "register", label: "Register", number: 1 },
    { id: "history", label: "Case History", number: 2 },
    { id: "patient-history", label: "Patient History", number: 3 },
    { id: "complaints", label: "Complaints", number: 4 },
    { id: "vision", label: "Vision", number: 5 },
    { id: "examination", label: "Examination", number: 6 },
    { id: "blood", label: "Blood Investigation", number: 7 },
    { id: "diagnosis", label: "Diagnosis", number: 8 },
    { id: "tests", label: "Tests", number: 9 },
    { id: "diagram", label: "Diagram", number: 10 },
    { id: "advice", label: "Advice", number: 11 },
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
            <Tabs value={currentStep} onValueChange={setCurrentStep} className="w-full">
              <TabsList className="h-auto grid grid-cols-5 lg:grid-cols-10 w-full p-1">
                {steps.map((step) => (
                  <TabsTrigger key={step.id} value={step.id} className="text-xs px-2 py-1.5">
                    {step.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <div className="min-h-[400px] mt-4">
                <TabsContent value="register" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">1. Register</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="case_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case No. *</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="patient_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient *</FormLabel>
                        <SimpleCombobox
                          options={["PAT001 - AARAV MEHTA","PAT002 - NISHANT KAREKAR","PAT003 - PRIYA NAIR"]}
                          value={field.value ? `${field.value} - ${field.value === 'PAT001' ? 'AARAV MEHTA' : field.value === 'PAT002' ? 'NISHANT KAREKAR' : 'PRIYA NAIR'}` : ''}
                          onChange={(v) => field.onChange(v.split(" - ")[0])}
                          placeholder="Search patient"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="visit_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visit Type *</FormLabel>
                        <SimpleCombobox
                          options={["First","Follow-up-1","Follow-up-2","Follow-up-3"]}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Search visit type"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="treatments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Treatments</FormLabel>
                      <TagMultiSelect
                        options={TREATMENT_OPTIONS}
                        values={field.value as any}
                        onChange={field.onChange}
                        placeholder="Search and select treatments"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="history" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">2. Case History</h3>
                <FormField
                  control={form.control}
                  name="chief_complaint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chief Complaint</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Patient's main complaint..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="history_present_illness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>History of Present Illness</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Detailed history..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="patient-history" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">3. Patient History</h3>
                <FormField
                  control={form.control}
                  name="past_history"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Past Medical History</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Previous medical conditions..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="treatment_history"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Treatment History</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Previous treatments..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="family_history"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Family History</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Family medical history..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="complaints" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">4. Complaints Form</h3>
                <FormField
                  control={form.control}
                  name="complaints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complaints</FormLabel>
                      <TagMultiSelect
                        options={COMPLAINT_OPTIONS}
                        values={field.value as any}
                        onChange={field.onChange}
                        placeholder="Search and select complaints"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="vision" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">5. Vision & Refraction</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vision_right_eye"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vision - Right Eye</FormLabel>
                        <SimpleCombobox
                          options={VISUAL_ACUITY_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Search VA Right"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vision_left_eye"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vision - Left Eye</FormLabel>
                        <SimpleCombobox
                          options={VISUAL_ACUITY_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Search VA Left"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="refraction_right"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Refraction - Right Eye</FormLabel>
                        <FormControl>
                          <Input placeholder="Sph: -1.00, Cyl: -0.50, Axis: 90" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="refraction_left"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Refraction - Left Eye</FormLabel>
                        <FormControl>
                          <Input placeholder="Sph: -1.00, Cyl: -0.50, Axis: 90" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="examination" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">6. Examination</h3>
                <FormField
                  control={form.control}
                  name="anterior_exam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anterior Segment Examination</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Lids, conjunctiva, cornea, anterior chamber, iris, lens..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="posterior_exam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posterior Segment Examination</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Vitreous, optic disc, macula, vessels, periphery..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="blood" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">7. Blood Investigation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="blood_pressure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Pressure</FormLabel>
                        <FormControl>
                          <Input placeholder="120/80 mmHg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="blood_sugar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Sugar</FormLabel>
                        <FormControl>
                          <Input placeholder="100 mg/dL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="blood_tests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Tests</FormLabel>
                        <TagMultiSelect
                          options={BLOOD_TEST_OPTIONS}
                          values={field.value as any}
                          onChange={field.onChange}
                          placeholder="Search and select investigations"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="diagnosis" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">8. Diagnosis</h3>
                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnosis</FormLabel>
                      <TagMultiSelect
                        options={DIAGNOSIS_OPTIONS}
                        values={field.value as any}
                        onChange={field.onChange}
                        placeholder="Search and select diagnoses"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="tests" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">9. Diagnostic Tests</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="iop_right"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IOP - Right Eye</FormLabel>
                        <FormControl>
                          <Input placeholder="15 mmHg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="iop_left"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IOP - Left Eye</FormLabel>
                        <FormControl>
                          <Input placeholder="15 mmHg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="sac_test"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SAC Test</FormLabel>
                      <FormControl>
                        <Input placeholder="Regurgitation test results..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="diagram" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">10. Diagram</h3>
                <EyeDrawingTool
                  rightEye={form.watch("right_eye_diagram")}
                  leftEye={form.watch("left_eye_diagram")}
                  defaultBothUrl={"/eye-drawing-2025-11-07.png"}
                  onChangeAction={(side: 'right' | 'left', dataUrl: string) => {
                    if (side === 'right') form.setValue('right_eye_diagram', dataUrl, { shouldDirty: true })
                    else form.setValue('left_eye_diagram', dataUrl, { shouldDirty: true })
                  }}
                />
              </TabsContent>

              <TabsContent value="advice" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">11. Advice</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="medicines"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medicines</FormLabel>
                        <SimpleCombobox
                          options={MEDICINE_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Search medicine"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dosage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dosage</FormLabel>
                        <SimpleCombobox
                          options={DOSAGE_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Search dosage"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="surgery_advised"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surgery Advised</FormLabel>
                      <SimpleCombobox
                        options={SURGERY_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Search surgery"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">{mode === "edit" ? "Update Case" : "Save Case"}</Button>
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

