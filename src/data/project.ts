export const project = {
  id: 'la-nueva-estancia',
  name: 'La Nueva Estancia',
  address: 'Subsector O-7a, frente a la Av. Huamán',
  district: 'Víctor Larco, Trujillo',
  delivery: 'Julio de 2027',
  geography: 'La Libertad, Perú',
  mapLink: 'https://maps.app.goo.gl/zvkqPdpbB7C25A9e6',
  mapEmbed: 'https://maps.google.com/maps?q=-8.132543,-79.026347&output=embed&z=16',
  totals: { lots: 340, homes: 1217, parking: 609 },
  typologies: [
    { id: 'lote-unifamiliar', label: 'Lotes unifamiliares', singular: 'Lote unifamiliar', lotCount: 241, area: '162 a 324 m²', description: 'Terrenos para diseñar y construir una vivienda propia.', icon: 'lot' },
    { id: 'departamento-multifamiliar', label: 'Departamentos', singular: 'Departamento multifamiliar', lotCount: 67, description: 'Viviendas proyectadas en edificios multifamiliares.', icon: 'apartment' },
    { id: 'casa-conjunto', label: 'Casas en conjunto', singular: 'Casa en conjunto residencial', lotCount: 32, description: 'Viviendas proyectadas en conjuntos residenciales.', icon: 'house' },
  ],
  nearby: ['Óvalo La Marina', 'Universidad Privada Antenor Orrego (UPAO)', 'Universidad César Vallejo', 'Jardín Botánico', 'Plaza Mayor de Trujillo'],
  portfolio: [
    [1991, 'Residencial Los Cedros'], [1996, 'Urbanización Santa Elena'],
    [2001, 'Condominio Las Palmeras'], [2006, 'Edificio Alameda Real'],
    [2012, 'Residencial Campiña del Norte'], [2018, 'Torres del Parque'],
    [2022, 'Mirador de La Libertad'],
  ],
} as const;

export const contact = {
  numbers: ['51923963761', '51987923466'],
  primary: 0,
  email: 'eliseoinmobiliaria4@gmail.com',
  hours: 'Lunes a sábado, de 7:00 a. m. a 7:00 p. m.',
};

export const navigation = [
  ['Proyecto', '/proyecto/'], ['Tipologías', '/tipologias/'], ['Ubicación', '/ubicacion/'],
  ['Tour 360°', '/tour/'], ['Avance', '/avance/'], ['Financiamiento', '/financiamiento/'],
  ['Nosotros', '/nosotros/'], ['Contacto', '/contacto/'],
] as const;

export const wap = (message = 'Hola, quisiera información sobre La Nueva Estancia.', number = contact.numbers[contact.primary]) =>
  `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

export const inquiry = (page: 'contacto' | 'financiamiento', options: { tipo?: string; lote?: string; finalidad?: string } = {}) => {
  const params = new URLSearchParams(Object.entries(options));
  return `/${page}/${params.size ? `?${params}` : ''}`;
};

export const areaFormat = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 });
