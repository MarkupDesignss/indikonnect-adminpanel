export const getDownlineMembers = () => [
  {
    id: 'IK-104',
    name: 'Marcus Cole',
    rank: 'Silver',
    status: 'Active',
    sales: 42500.00,
    initials: 'MC',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuTuARe2lkbHJUDf9gcZ71K0uhG4cfz-NIYTiDZg_zlcL00eFIp_zwtd9q3kYOO9k4S_2wLq0bagbIm6fkauq_wYHYjLalWFGeHxbSBUw1TWuGcs9HR-SaJE-ZM3gQu2z0o5um2p9fg_gQp2buWN5mTxPvfYSM29NWUnVo0xuJP3LcoH9T6gDBRxPsbk9rNR6HhLNm447PFICHXcGEfNyNXqxXWOHip1XIRMk_X2dZY9FefJ3lpaOkQA',
  },
  {
    id: 'IK-109',
    name: 'David Kim',
    rank: 'Associate',
    status: 'Inactive',
    sales: 2140.00,
    initials: 'DK',
  },
  {
    id: 'IK-115',
    name: 'Aisha Patel',
    rank: 'Gold',
    status: 'Active',
    sales: 118200.50,
    initials: 'AP',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuMViP1KcaXZMxC2iX4z4bb4PFkOByxd2GafO9_IoubtLG_Hs44B7_pfMg1MEf3NN-cDNEybdEmhC_1NIsN3KJqcGBkzWSsoPDekOR2exfpZk240uWSG5md7WV5q2jN8jX7n1EqpF9voydxmL0E1pCGRV2CWvHSeRiUiMmINvAIbAaSEEZG36-xLbXeQ37Hbejn0Sa0oCHXJu25AyzQc75lg3q4tKk9v99KOcxr3_K89bf_C53sFUiMg',
  },
  {
    id: 'IK-201',
    name: 'Elena Rivera',
    rank: 'Associate',
    status: 'Active',
    sales: 12450.00,
    initials: 'ER',
  },
];

export const getSelectedMemberData = () => ({
  id: 'IK-115',
  name: 'Aisha Patel',
  rank: 'Gold',
  status: 'Active',
  joinDate: 'Oct 12, 2023',
  sponsor: { name: 'Sarah Jenkins', id: 'IK-001' },
  contact: {
    email: 'a.patel@distributor.net',
    phone: '+1 (555) 293-4811',
    location: 'Chicago, IL, USA',
  },
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB47pc1rCmyxyvCsQGXp0US2kG0HLdfClYAygVJFwOqnKxB2Zfxhx4o9Bl4MkYSv9FX74ajnF2Q12U8rbGFXEARo_4yLh7s4Cqjm7lWKbPm66RmJzgCImVQudRde0NtTKXovq6uU3HB7VAS_tUr8nURwMfJMHSfN8_gT5sE-TLa3qpzbPYcZjg9W4fJfZegQkUXYeVZ02WT2L4f40q5rnquUN4E7ofNU5HZoG1sOrxT0VZSV1eZSeM9Kw',
});
