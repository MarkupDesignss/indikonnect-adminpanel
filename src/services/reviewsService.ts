export const getReviews = () => [
  {
    id: 1,
    product: 'Industrial LED High Bay Light',
    customer: 'Sarah Jenkins',
    date: 'Oct 24, 2023',
    rating: 4,
    status: 'Pending',
    comment:
      'Good quality lights, but the packaging was slightly damaged upon arrival. Installation was straightforward.',
  },
  {
    id: 2,
    product: 'Commercial Grade Extension Cord 50ft',
    customer: 'TechBuild Inc.',
    date: 'Oct 23, 2023',
    rating: 2,
    status: 'Pending',
    comment: '',
  },
  {
    id: 3,
    product: 'Smart Warehouse Sensor Kit v2',
    customer: 'Marcus Cole',
    date: 'Oct 21, 2023',
    rating: 5,
    status: 'Approved',
    comment: '',
  },
];

export const getSelectedReview = () => ({
  id: 1,
  product: 'Industrial LED High Bay Light',
  customer: 'Sarah Jenkins',
  date: 'Oct 24, 2023',
  rating: 4,
  status: 'Pending',
  title: 'Solid performance, minor shipping issue',
  comment:
    'We ordered 50 of these for our new warehouse expansion. The light output is fantastic and exactly what we needed for the high ceilings. Installation was straightforward as advertised. However, I\'m giving 4 stars instead of 5 because about 3 of the boxes arrived pretty banged up. The lights inside were fine, but better protective packaging would be appreciated for bulk orders like this. Will likely order again for phase 2.',
  customerProfile: {
    initials: 'SJ',
    name: 'Sarah Jenkins',
    role: 'Procurement Manager',
    totalOrders: 12,
    totalReviews: 4,
    accountStatus: 'Active',
  },
  productContext: {
    name: 'Industrial LED High Bay Light, 150W',
    sku: 'LGT-HB-150W',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAyIh70qvOins0jht3G3XPO7FYcKwV1kI1VzH77fw4_byxehrdmY4Fh_MlVzS6cO0jlqT_rZP6ng-9OdoGHCnE57AjD40ikooMLoDW8Ba8xh0YNXqJqFPE-mR6rPqXEUTK5NPG8S4tVFLruSJAK6Tny5pjjPMEljrbpEAifRKpCucX9rfpqz5krPY3KLZC6j_cUkCtVthXCdb6TfhcLu-H_tQJuE3G4NzxMnmgfgp9C6Ed-MGwJvlU9iQ',
    overallRating: 4.8,
    totalRatings: 128,
  },
});
