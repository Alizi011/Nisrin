import arganOil from '@/assets/argan-oil.jpg'
import pricklyPear from '@/assets/prickly-pear.jpg'
import rhassoulClay from '@/assets/rhassoul-clay.jpg'
import roseWater from '@/assets/rose-water.jpg'
import beldiSoap from '@/assets/beldi-soap.jpg'
import saffronCream from '@/assets/saffron-cream.jpg'
import kessaGlove from '@/assets/kessa-glove.jpg'
import orangeBlossom from '@/assets/orange-blossom.jpg'
import amberPerfume from '@/assets/amber-perfume.jpg'
import roseLip from '@/assets/rose-lip.jpg'
import hammamSet from '@/assets/hammam-set.jpg'
import akerFassi from '@/assets/aker-fassi.jpg'

export type Category = 'Olje' | 'Serum' | 'Maske' | 'Rens' | 'Krem' | 'Mist' | 'Lepper' | 'Kropp' | 'Sett'

export type Badge = 'Bestseller' | 'Nyhet' | 'Kun noen få igjen'

export interface Variant {
  label: string
  price: number
}

export interface Review {
  id: string
  author: string
  rating: number
  date: string
  text: string
}

export interface Product {
  id: string
  name: string
  subtitle: string
  category: Category
  concerns: string[]
  price: number
  compareAt?: number
  image: string
  badge?: Badge
  rating: number
  reviewCount: number
  description: string
  ingredients: string
  usage: string
  variants: Variant[]
  reviews: Review[]
}

export const CATEGORIES: Category[] = ['Olje', 'Serum', 'Maske', 'Rens', 'Krem', 'Mist', 'Lepper', 'Kropp', 'Sett']

export const CONCERNS = ['Tørr hud', 'Glød', 'Anti-age', 'Urenheter', 'Sensitiv hud'] as const

export const PRODUCTS: Product[] = [
  {
    id: 'argan-olje',
    name: 'Ren Arganolje',
    subtitle: 'Kaldpresset · Agadir',
    category: 'Olje',
    concerns: ['Tørr hud', 'Anti-age', 'Glød'],
    price: 349,
    image: arganOil,
    badge: 'Bestseller',
    rating: 4.9,
    reviewCount: 212,
    description:
      'Vår signaturolje presses kaldt av argannøtter fra kooperativer i Agadir-regionen. Rik på vitamin E og fettsyrer som mykgjør, nærer og gjenoppbygger hudbarrieren — uten å etterlate en fettete hinne.',
    ingredients: '100 % økologisk Argania Spinosa (argan) kjerneolje. Ingredienser: Argania Spinosa Kernel Oil.',
    usage: 'Varm 2–3 dråper mellom håndflatene og press inn i fuktig hud morgen og kveld. Kan også brukes i hår og på neglebånd.',
    variants: [
      { label: '30 ml', price: 349 },
      { label: '50 ml', price: 489 },
    ],
    reviews: [
      { id: 'r1', author: 'Ingrid M.', rating: 5, date: '2026-08-14', text: 'Hudens min har aldri vært mykere. Trekker inn på sekunder og lukter nydelig nøtteaktig.' },
      { id: 'r2', author: 'Sara L.', rating: 5, date: '2026-07-30', text: 'Bruker den hver kveld. Tørr vinterhud er historie.' },
      { id: 'r3', author: 'Amine K.', rating: 4, date: '2026-06-21', text: 'Veldig ren olje, akkurat som den jeg får hjemme i Marokko.' },
    ],
  },
  {
    id: 'kaktusfiken-serum',
    name: 'Kaktusfiken Serum',
    subtitle: 'Nattserum · Sous-dalen',
    category: 'Serum',
    concerns: ['Anti-age', 'Glød'],
    price: 549,
    compareAt: 649,
    image: pricklyPear,
    badge: 'Nyhet',
    rating: 4.8,
    reviewCount: 87,
    description:
      'Kaktusfikenfrøolje er en av verdens sjeldneste oljer — det trengs åtte millioner frø til én liter. Ekstremt rik på betalainer og linolsyre, den glatter fine linjer og gir en rolig, jevn glød mens du sover.',
    ingredients: 'Opuntia Ficus-Indica Seed Oil, Tocopherol (vitamin E), Rosa Damascena Flower Oil.',
    usage: 'Påfør 3–4 dråper på renset hud hver kveld, før krem. Unngå øyeområdet ved første bruk — test på et lite område.',
    variants: [
      { label: '15 ml', price: 549 },
      { label: '30 ml', price: 890 },
    ],
    reviews: [
      { id: 'r1', author: 'Live H.', rating: 5, date: '2026-08-28', text: 'Verdt hver krone. Våkner med plumpet hud hver eneste morgen.' },
      { id: 'r2', author: 'Nora E.', rating: 5, date: '2026-08-02', text: 'Fine linjer rundt øynene er synlig glattere etter tre uker.' },
    ],
  },
  {
    id: 'rhassoul-leirmaske',
    name: 'Rhassoul Leirmaske',
    subtitle: 'Dyprens · Atlasfjellene',
    category: 'Maske',
    concerns: ['Urenheter', 'Glød'],
    price: 289,
    image: rhassoulClay,
    rating: 4.7,
    reviewCount: 156,
    description:
      'Rhassoul-leire har blitt hentet fra de samme årene i Atlasfjellene i over 1400 år. Mineralet rik leiren trekker ut urenheter som en magnet, uten å strippe huden for naturlige oljer.',
    ingredients: '100 % naturlig Marokkansk Lava Clay (rhassoul). Ingen tilsetningsstoffer.',
    usage: 'Bland 1 ss leire med rosvann til en kremet pasta. Påfør i et jevnt lag, la virke 8–10 minutter og skyll før den tørker helt. Bruk 1–2 ganger i uken.',
    variants: [
      { label: '150 g', price: 289 },
      { label: '300 g', price: 459 },
    ],
    reviews: [
      { id: 'r1', author: 'Mina T.', rating: 5, date: '2026-08-19', text: 'Porene mine er synlig mindre. Bland den med rosvannet deres — perfekt kombinasjon.' },
      { id: 'r2', author: 'Jonas P.', rating: 4, date: '2026-07-11', text: 'Eneste maske som renser uten at huden strammer etterpå.' },
    ],
  },
  {
    id: 'rosvann-toner',
    name: 'Rosvann Toner',
    subtitle: 'Damaskrose · Kelâat M\'Gouna',
    category: 'Mist',
    concerns: ['Sensitiv hud', 'Tørr hud', 'Glød'],
    price: 229,
    image: roseWater,
    badge: 'Bestseller',
    rating: 4.9,
    reviewCount: 340,
    description:
      'Destillert av Damaskroser håndplukket i Rosendalen ved Kelâat M\'Gouna. Beroliger rødhet, balanserer pH og forbereder huden på serum og olje. En oppfriskende tåke av ren rose.',
    ingredients: 'Rosa Damascena Flower Water (100 % destillert rosvann).',
    usage: 'Spray direkte på ansiktet etter rens, eller over makeup for å friske opp. Oppbevares gjerne kjølig om sommeren.',
    variants: [
      { label: '100 ml', price: 229 },
      { label: '200 ml', price: 379 },
    ],
    reviews: [
      { id: 'r1', author: 'Emma S.', rating: 5, date: '2026-09-01', text: 'Lukten er helt uvirkelig — som å gå gjennom en rosehage. Hudens min elsker det.' },
      { id: 'r2', author: 'Yasmin A.', rating: 5, date: '2026-08-08', text: 'Rødheten i kinnene mine har roet seg betraktelig.' },
      { id: 'r3', author: 'Oda B.', rating: 4, date: '2026-06-15', text: 'Forfriskende og mild. Sprayen gir en fin tåke.' },
    ],
  },
  {
    id: 'beldi-svartsaape',
    name: 'Beldi Svartsåpe',
    subtitle: 'Hammam-rens · Oliven & eukalyptus',
    category: 'Rens',
    concerns: ['Urenheter', 'Glød'],
    price: 199,
    image: beldiSoap,
    rating: 4.6,
    reviewCount: 128,
    description:
      'Den tradisjonelle hammam-såpen: en mørk, silkemyk pasta av malte oliven og eukalyptus. Mykgjør huden og løsner døde hudceller — grunnlaget for det marokkanske skrubberitualet.',
    ingredients: 'Olea Europaea (oliven) fruktolje, Aqua, Eucalyptus Globulus Leaf Oil, Potassium Hydroxide.',
    usage: 'Påfør i et tynt lag på fuktig hud, la virke 5–10 minutter, og skrubb deretter med kessa-hanske. Skyll godt. Bruk 1–2 ganger i uken.',
    variants: [{ label: '200 g', price: 199 }],
    reviews: [
      { id: 'r1', author: 'Silje R.', rating: 5, date: '2026-08-25', text: 'Sammen med kessa-hansken er dette rene hammam-opplevelsen hjemme.' },
      { id: 'r2', author: 'Karim B.', rating: 4, date: '2026-07-19', text: 'Autentisk beldi. Eukalyptusduften fyller hele badet.' },
    ],
  },
  {
    id: 'safran-ansiktskrem',
    name: 'Safran Ansiktskrem',
    subtitle: 'Rik nattkrem · Taliouine-safran',
    category: 'Krem',
    concerns: ['Anti-age', 'Tørr hud', 'Glød'],
    price: 649,
    image: saffronCream,
    badge: 'Kun noen få igjen',
    rating: 4.8,
    reviewCount: 74,
    description:
      'Safran fra Taliouine — verdens mest verdifulle krydder — er full av antioksidanter som beskytter mot frie radikaler. En rik, smeltende krem som jobber natten gjennom for fastere, lysere hud.',
    ingredients: 'Aqua, Argania Spinosa Kernel Oil, Crocus Sativus (safran) ekstrakt, Butyrospermum Parkii, Cera Alba, Tocopherol.',
    usage: 'Påfør en hasselnøtt-størrelse på renset ansikt og hals hver kveld, som siste steg i rutinen.',
    variants: [{ label: '50 ml', price: 649 }],
    reviews: [
      { id: 'r1', author: 'Astrid V.', rating: 5, date: '2026-08-30', text: 'Luksus i et glass. Huden føles både mettet og lett morgenen etter.' },
      { id: 'r2', author: 'Hanna D.', rating: 5, date: '2026-07-27', text: 'Min favoritt noensinne. Gløden er merkbar etter få dager.' },
    ],
  },
  {
    id: 'kessa-hanske',
    name: 'Kessa Skrubbehanske',
    subtitle: 'Håndvevd · Hammam-klassiker',
    category: 'Kropp',
    concerns: ['Urenheter'],
    price: 129,
    image: kessaGlove,
    rating: 4.7,
    reviewCount: 203,
    description:
      'Den grove, håndvevde kessa-hansken er hammam-ritualets verktøy. Brukt sammen med beldi-såpe løfter den bort døde hudceller og etterlater huden silkeglatt og klar til å ta imot olje.',
    ingredients: '100 % vevd viskose. Håndlaget i Marokko.',
    usage: 'Etter beldi-såpen har virket: fukt hansken og skrubb i lange, faste strøk. Skyll og heng til tørk. Bytt hver 6–8. uke.',
    variants: [{ label: 'Én størrelse', price: 129 }],
    reviews: [
      { id: 'r1', author: 'Marte O.', rating: 5, date: '2026-08-12', text: 'Utrulig kor glatt huden blir. Aldri mer kjemisk peeling.' },
      { id: 'r2', author: 'Leila N.', rating: 4, date: '2026-06-29', text: 'Solid kvalitet, akkurat som i hammamet i Marrakech.' },
    ],
  },
  {
    id: 'appelsinblomst-mist',
    name: 'Appelsinblomst Mist',
    subtitle: 'Beroligende tåke · Neroli',
    category: 'Mist',
    concerns: ['Sensitiv hud', 'Glød'],
    price: 259,
    image: orangeBlossom,
    badge: 'Nyhet',
    rating: 4.8,
    reviewCount: 61,
    description:
      'Destillert av bitre appelsinblomster — neroli — kjent for å roe både hud og sinn. En lett, oppkvikkende tåke som binder fuktighet og gir umiddelbar friskhet.',
    ingredients: 'Citrus Aurantium Amara (neroli) Flower Water, Glycerin (vegetabilsk).',
    usage: 'Spray over ansiktet når huden trenger en oppfriskning — etter rens, over makeup eller midt på dagen.',
    variants: [
      { label: '100 ml', price: 259 },
      { label: '200 ml', price: 419 },
    ],
    reviews: [
      { id: 'r1', author: 'Camilla F.', rating: 5, date: '2026-08-22', text: 'Duften er beroligende, nesten meditativ. Fast inventar i håndveska.' },
    ],
  },
  {
    id: 'rav-fast-parfyme',
    name: 'Rav Fast Parfyme',
    subtitle: 'Amber & musk · Messingetui',
    category: 'Kropp',
    concerns: ['Glød'],
    price: 389,
    image: amberPerfume,
    rating: 4.9,
    reviewCount: 98,
    description:
      'En smeltbar parfymeresin av rav, musk og en antydning vanilje, i et håndgraver messingetui. Varmes opp av huden og utvikler en dyp, varm duft som varer hele dagen.',
    ingredients: 'Parfym (rav, musk, vanilje), Cera Alba, Butyrospermum Parkii.',
    usage: 'Varm en liten mengde med fingertuppen og press inn på pulsårer — håndledd, hals og bak ørene.',
    variants: [{ label: '15 g', price: 389 }],
    reviews: [
      { id: 'r1', author: 'Sofie G.', rating: 5, date: '2026-08-17', text: 'Den vakreste duften jeg eier. Får komplimanger overalt.' },
      { id: 'r2', author: 'Rania H.', rating: 5, date: '2026-07-05', text: 'Etuiet alene er verdt prisen — et lite smykke.' },
    ],
  },
  {
    id: 'rose-leppepomade',
    name: 'Rose & Honning Leppepomade',
    subtitle: 'Nærende · Manuka-honning',
    category: 'Lepper',
    concerns: ['Tørr hud'],
    price: 149,
    image: roseLip,
    rating: 4.6,
    reviewCount: 145,
    description:
      'En smeltende pomade av rosevoks, honning og arganolje som legger seg som et silkelett lag over leppene. Gir et svakt rosa skjær og langvarig fukt.',
    ingredients: 'Rosa Damascena Flower Wax, Mel (honning), Argania Spinosa Kernel Oil, Ricinus Communis Seed Oil, Cera Alba.',
    usage: 'Påfør på leppene etter behov — alene, eller over Aker Fassi for ekstra dybde.',
    variants: [{ label: '10 g', price: 149 }],
    reviews: [
      { id: 'r1', author: 'Julie A.', rating: 4, date: '2026-08-05', text: 'Myke lepper hele vinteren. Fin som overnattingmaske også.' },
    ],
  },
  {
    id: 'hammam-gavesett',
    name: 'Hammam Gavesett',
    subtitle: 'Det komplette ritualet',
    category: 'Sett',
    concerns: ['Tørr hud', 'Glød', 'Urenheter'],
    price: 899,
    compareAt: 1076,
    image: hammamSet,
    badge: 'Bestseller',
    rating: 5.0,
    reviewCount: 89,
    description:
      'Alt du trenger for et autentisk hammam-ritual hjemme: beldi svartsåpe, kessa-hanske, ren arganolje (30 ml) og rosvann toner — pakket i en vakker trekasse klar til å gis bort.',
    ingredients: 'Se enkeltproduktene for full ingrediensliste.',
    usage: 'Følg ritualet: 1) Beldi-såpe 2) Kessa-skrubb 3) Rhassoul eller rosvann 4) Arganolje. En guide på norsk følger med.',
    variants: [{ label: '4 deler', price: 899 }],
    reviews: [
      { id: 'r1', author: 'Kristine W.', rating: 5, date: '2026-09-02', text: 'Ga dette til mamma — hun var overlykkelig. Kassen er nydelig.' },
      { id: 'r2', author: 'Omar E.', rating: 5, date: '2026-08-10', text: 'Komplett og gjennomført. Ritualet på norsk var et fint touch.' },
    ],
  },
  {
    id: 'aker-fassi',
    name: 'Aker Fassi Lepp- og Kinntint',
    subtitle: 'Valmue & granateple · Tradisjonspott',
    category: 'Lepper',
    concerns: ['Glød'],
    price: 219,
    image: akerFassi,
    badge: 'Nyhet',
    rating: 4.7,
    reviewCount: 53,
    description:
      'Berberkvinnenes århundre gamle hemmelighet: et tørket pigment av valmueblad og granateple i en håndmalt leirpott. Fuktes med pensel og gir lepper og kinn en naturlig, dyp rosefarge.',
    ingredients: 'Papaver Rhoeas (valmue) ekstrakt, Punica Granatum (granateple) ekstrakt, naturlige mineralpigmenter.',
    usage: 'Fukt en liten pensel eller fingertupp og dra lett over pigmentet. Bygg opp fargen i tynne lag på lepper og kinn.',
    variants: [{ label: 'Én pott', price: 219 }],
    reviews: [
      { id: 'r1', author: 'Thea K.', rating: 5, date: '2026-08-26', text: 'Den mest naturlige rougen jeg har prøvd. Holder hele dagen.' },
      { id: 'r2', author: 'Imane Z.', rating: 4, date: '2026-07-22', text: 'Nostalgi i en pott — akkurat slik bestemor brukte den.' },
    ],
  },
]

export const FREE_SHIPPING_THRESHOLD = 600
export const SHIPPING_COST = 59

export function formatPrice(n: number): string {
  return `${n.toLocaleString('nb-NO')} kr`
}
