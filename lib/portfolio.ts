export type PortfolioMedia={
  src:string;
  alt:string;
  focal?:string;
  label?:string;
};

export type ResidenceType={
  slug:string;
  name:string;
  bedrooms:string;
  descriptor:string;
  hero:PortfolioMedia;
  gallery:PortfolioMedia[];
  sourceNote:string;
};

export type PortfolioProject={
  slug:string;
  name:string;
  location:string;
  country:string;
  developer:string;
  positioning:string;
  hero:PortfolioMedia;
  masterplan:PortfolioMedia;
  facts:Array<{label:string;value:string}>;
  residences:ResidenceType[];
  sourceLabel:string;
  sourceUrl:string;
  verifiedAt:string;
};

const diamante:ResidenceType={
  slug:'diamante',
  name:'Diamante',
  bedrooms:'6 bedrooms',
  descriptor:'A sculptural villa typology from the Tierra Viva source library.',
  hero:{
    src:'https://cdn.darglobal.co.uk/DG_AL_Diamente_Villa_Ext_2_2_a4790ab5a2.jpg',
    alt:'Tierra Viva Diamante villa exterior architectural render',
    focal:'center 56%',
    label:'Exterior'
  },
  gallery:[
    {
      src:'https://cdn.darglobal.co.uk/thumbnail_dg_al_diamente_villa_ext_1_a3cdf901b2.jpg',
      alt:'Tierra Viva Diamante villa exterior render',
      focal:'center 52%',
      label:'Exterior'
    },
    {
      src:'https://cdn.darglobal.co.uk/thumbnail_dg_al_diamente_villa_id_living_eadb0bb73a.jpg',
      alt:'Tierra Viva Diamante villa living interior render',
      focal:'center 58%',
      label:'Living'
    }
  ],
  sourceNote:'Residence-type material is retained in the Private Office source library. Current availability and commercial terms must be confirmed by the office before presentation to a client.'
};

const zafiro:ResidenceType={
  slug:'zafiro',
  name:'Zafiro',
  bedrooms:'5 bedrooms',
  descriptor:'A five-bedroom villa typology arranged for long Mediterranean views.',
  hero:{
    src:'https://cdn.darglobal.co.uk/DG_AL_Zafiro_Villa_Ext_1_2_bd6c43ca4f.jpg',
    alt:'Tierra Viva Zafiro villa exterior architectural render',
    focal:'center 54%',
    label:'Exterior'
  },
  gallery:[
    {
      src:'https://cdn.darglobal.co.uk/DG_AL_Zafiro_Villa_Ext_3_2_e17dec1c88.jpg',
      alt:'Tierra Viva Zafiro villa exterior render',
      focal:'center 50%',
      label:'Exterior'
    },
    {
      src:'https://cdn.darglobal.co.uk/DG_AL_Zafiro_Villa_Int_Living_2_0faff39b0c.jpg',
      alt:'Tierra Viva Zafiro villa living room render',
      focal:'center 54%',
      label:'Living'
    },
    {
      src:'https://cdn.darglobal.co.uk/DG_AL_Zafiro_Villa_Int_Dining_2_59588f9ca6.jpg',
      alt:'Tierra Viva Zafiro villa dining room render',
      focal:'center 54%',
      label:'Dining'
    },
    {
      src:'https://cdn.darglobal.co.uk/DG_AL_Zafiro_Villa_Int_Master_Bedroom_2_dfa6c47c59.jpg',
      alt:'Tierra Viva Zafiro villa master bedroom render',
      focal:'center 52%',
      label:'Master bedroom'
    }
  ],
  sourceNote:'Residence-type material is retained in the Private Office source library. Current availability and commercial terms must be confirmed by the office before presentation to a client.'
};

const esmeralda:ResidenceType={
  slug:'esmeralda',
  name:'Esmeralda',
  bedrooms:'4 bedrooms',
  descriptor:'A four-bedroom villa typology with terraces opening toward the landscape.',
  hero:{
    src:'https://cdn.darglobal.co.uk/DG_AL_Esmeralda_Villa_Ext_2_2_00c83a3d39.jpg',
    alt:'Tierra Viva Esmeralda villa exterior architectural render',
    focal:'center 54%',
    label:'Exterior'
  },
  gallery:[
    {
      src:'https://cdn.darglobal.co.uk/DG_AL_Esmeralda_Villa_Ext_3_2_7107dfb0cf.jpg',
      alt:'Tierra Viva Esmeralda villa exterior render',
      focal:'center 48%',
      label:'Exterior'
    },
    {
      src:'https://cdn.darglobal.co.uk/DG_AL_Esmeralda_Villa_Int_Living_2_d4dad80bb6.jpg',
      alt:'Tierra Viva Esmeralda villa living room render',
      focal:'center 56%',
      label:'Living'
    },
    {
      src:'https://cdn.darglobal.co.uk/DG_AL_Esmeralda_Villa_Int_Balcony_2_e676472fdd.jpg',
      alt:'Tierra Viva Esmeralda villa balcony render',
      focal:'center 50%',
      label:'Balcony'
    },
    {
      src:'https://cdn.darglobal.co.uk/DG_AL_Esmeralda_Villa_Int_Master_Bedroom_2_2d3ff4edf2.jpg',
      alt:'Tierra Viva Esmeralda villa master bedroom render',
      focal:'center 52%',
      label:'Master bedroom'
    }
  ],
  sourceNote:'Residence-type material is retained in the Private Office source library. Current availability and commercial terms must be confirmed by the office before presentation to a client.'
};

export const tierraViva:PortfolioProject={
  slug:'tierra-viva',
  name:'Tierra Viva',
  location:'Benahavís',
  country:'Spain',
  developer:'DarGlobal',
  positioning:'A gated villa community set into the hills above the Costa del Sol, with design inspired by Automobili Lamborghini.',
  hero:diamante.hero,
  masterplan:{
    src:'https://cdn.darglobal.co.uk/DG_AL_Tierra_Viva_Aerial_1_10_06_37_AM_ce0428bc79.jpg',
    alt:'Aerial architectural render of Tierra Viva in the hills of Benahavís',
    focal:'center 48%',
    label:'Masterplan'
  },
  facts:[
    {label:'Property type',value:'Villa'},
    {label:'Project status',value:'Under development'},
    {label:'Expected completion',value:'June 2028'},
    {label:'Area',value:'700–1,450 sqm'}
  ],
  residences:[diamante,zafiro,esmeralda],
  sourceLabel:'Developer project page',
  sourceUrl:'https://darglobal.co.uk/tierra-viva',
  verifiedAt:'26 Sep 2026'
};

export const portfolioProjects=[tierraViva];

export function getResidence(slug:string){return tierraViva.residences.find(item=>item.slug===slug)??null}
