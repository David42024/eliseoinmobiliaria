const mapCoordinates = encodeURIComponent('-8.132543,-79.026347');
const mapEmbed = `https://www.google.com/maps?q=${mapCoordinates}&output=embed&z=17&hl=es`;

export const project = {
  id: 'la-nueva-estancia',
  name: 'La Nueva Estancia',
  address: 'Subsector O-7a, frente a la Av. Huamán',
  district: 'Víctor Larco, Trujillo',
  delivery: 'Julio de 2027',
  geography: 'La Libertad, Perú',
  mapLink: 'https://maps.app.goo.gl/zvkqPdpbB7C25A9e6',
  mapEmbed,
  mapSatelliteEmbed: `${mapEmbed}&t=k`,
  streetView: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${mapCoordinates}`,
  totals: { lots: 340, homes: 1217, parking: 609 },
  typologies: [
    {
      id: 'lote-unifamiliar', slug: 'lotes-unifamiliares', label: 'Lote unifamiliar', singular: 'Lote unifamiliar',
      lotCount: 241, plotUse: 'vivienda unifamiliar', area: '162 a 324 m²', icon: 'lot',
      description: 'Terrenos para diseñar y construir una vivienda propia.',
      detailHeading: 'Elige el terreno para tu vivienda',
      detail: 'Al comparar lotes, considera la superficie, la orientación y la ubicación dentro de la urbanización. El equipo de ventas puede confirmar qué opciones están disponibles.',
    },
    {
      id: 'departamento-multifamiliar', slug: 'departamentos', label: 'Departamento multifamiliar', singular: 'Departamento multifamiliar',
      lotCount: 67, plotUse: 'vivienda multifamiliar', icon: 'apartment',
      description: 'Viviendas proyectadas en edificios multifamiliares.',
      detailHeading: 'Vivienda en edificios multifamiliares',
      detail: 'La habilitación destina parte de sus lotes a vivienda multifamiliar. Si te interesa un departamento, consulta al equipo de ventas por superficies, distribución y disponibilidad de unidades.',
    },
    {
      id: 'casa-conjunto', slug: 'casas-en-conjunto', label: 'Casa en conjunto residencial', singular: 'Casa en conjunto residencial',
      lotCount: 32, plotUse: 'conjuntos residenciales', icon: 'house',
      description: 'Viviendas proyectadas en conjuntos residenciales.',
      detailHeading: 'Casas dentro de un conjunto residencial',
      detail: 'Esta tipología está destinada a quienes buscan una casa como parte de un conjunto residencial. Solicita la distribución de la vivienda y las condiciones de preventa al equipo de Elíseo.',
    },
  ],
  spaces: [
    {
      slug: 'parques-y-areas-verdes', label: 'Parques y áreas verdes', icon: 'trees',
      description: 'La habilitación prevé parques, señalización y mobiliario urbano.',
      topics: [
        { title: 'Parques proyectados', text: 'El diseño de La Nueva Estancia incorpora parques y áreas verdes dentro de la urbanización residencial.' },
        { title: 'Equipamiento urbano', text: 'La propuesta incluye señalización y mobiliario urbano. El plano maestro permitirá ubicar las áreas verdes y conocer su distribución.' },
      ],
      action: { label: 'Ver avance de obra', href: '/avance/' },
    },
    {
      slug: 'recreacion-y-educacion', label: 'Recreación y educación', icon: 'education',
      description: 'El diseño urbano destina espacios para recreación, educación y otros usos.',
      topics: [
        { title: 'Espacios para recreación', text: 'La habilitación considera áreas destinadas al esparcimiento dentro del proyecto residencial.' },
        { title: 'Usos educativos', text: 'La propuesta prevé espacios para educación. Consulta con Elíseo por la distribución y el equipamiento previstos.' },
      ],
      action: { label: 'Consultar con Elíseo', href: '/contacto/' },
    },
    {
      slug: 'servicios-y-conectividad', label: 'Servicios y conexión vial', icon: 'route',
      description: 'La propuesta contempla servicios urbanos y conexiones con las principales vías de Trujillo.',
      topics: [
        { title: 'Servicios urbanos', text: 'Los servicios forman parte de la habilitación proyectada. El equipo comercial puede orientarte sobre las características previstas y su alcance.' },
        { title: 'Acceso por la Av. Huamán', text: 'El proyecto está cerca del óvalo La Marina, con conexión hacia la Panamericana Norte. En Ubicación puedes consultar el mapa y los puntos de referencia.' },
      ],
      action: { label: 'Ver mapa y accesos', href: '/ubicacion/' },
    },
  ],
  nearby: ['Óvalo La Marina', 'Universidad Privada Antenor Orrego (UPAO)', 'Universidad César Vallejo', 'Jardín Botánico', 'Plaza Mayor de Trujillo'],
  portfolio: [
    [1991, 'Residencial Los Cedros'], [1996, 'Urbanización Santa Elena'],
    [2001, 'Condominio Las Palmeras'], [2006, 'Edificio Alameda Real'],
    [2012, 'Residencial Campiña del Norte'], [2018, 'Torres del Parque'],
    [2022, 'Mirador de La Libertad'],
  ],
} as const;

export const typologyPath = (type: (typeof project.typologies)[number]) => `/tipologias/${type.slug}/`;
export const spacePath = (space: (typeof project.spaces)[number]) => `/proyecto/${space.slug}/`;

export const contact = {
  numbers: ['51923963761', '51987923466'],
  primary: 0,
  email: 'eliseoinmobiliaria4@gmail.com',
  hours: 'Lunes a sábado, de 7:00 a. m. a 7:00 p. m.',
  social: [
    { name: 'Instagram', icon: 'instagram', href: 'https://www.instagram.com/eliseoinmobiliaria_peru/' },
    { name: 'Facebook', icon: 'facebook', href: 'https://www.facebook.com/share/193vVPuudz/' },
    { name: 'TikTok', icon: 'tiktok', href: 'https://www.tiktok.com/@elseo.inmobiliari' },
  ] as const,
};

export const navigation = [
  ['Inicio', '/'], ['Proyecto', '/proyecto/'], ['Tipologías', '/tipologias/'], ['Ubicación', '/ubicacion/'],
  ['Tour 360°', '/tour/'], ['Avance', '/avance/'], ['Financiamiento', '/financiamiento/'],
  ['Nosotros', '/nosotros/'], ['Contacto', '/contacto/'],
] as const;

export function salesMessage(purpose = 'informacion', context = '') {
  const request = purpose === 'visita'
    ? '¿Qué días y horarios tienen disponibles para una visita guiada?'
    : purpose === 'cotizacion'
      ? '¿Podrían enviarme el precio vigente, la disponibilidad y las opciones de pago?'
      : '¿Podrían orientarme sobre las opciones disponibles y cómo agendar una visita?';
  return `¡Hola, equipo de Elíseo Inmobiliaria! Estoy interesado en La Nueva Estancia.${context ? `\n\nMi consulta es sobre ${context}.` : ''}\n\n${request}\n\n¡Gracias!`;
}

export const demoLotMessage = (id: string) =>
  `¡Hola, equipo de Elíseo! Vi el lote de demostración ${id} en el sitio de La Nueva Estancia. ¿Podrían mostrarme opciones similares que estén disponibles? ¡Gracias!`;

export const wap = (message = salesMessage(), number = contact.numbers[contact.primary]) =>
  `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

export const inquiry = (page: 'contacto' | 'financiamiento', options: { tipo?: string; lote?: string; finalidad?: string } = {}) => {
  const params = new URLSearchParams(Object.entries(options));
  return `/${page}/${params.size ? `?${params}` : ''}`;
};

export const areaFormat = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 });
