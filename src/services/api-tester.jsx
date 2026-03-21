import { api } from './api.js';

const testAllApis = async () => {
  console.log('🧪 Testing ALL APIs...');
  
  // Auth/Admin APIs (known 500s)
  try {
    console.log('-- Testing getAllAdminUsers --');
    const admins = await api.getAllAdminUsers();
    console.log('✅ getAllAdminUsers:', admins.length);
  } catch (e) {
    console.error('❌ getAllAdminUsers failed:', e.message);
  }

  try {
    console.log('-- Testing getPendingRegistrations --');
    const pending = await api.getPendingRegistrations();
    console.log('✅ getPendingRegistrations:', pending.length);
  } catch (e) {
    console.error('❌ getPendingRegistrations failed:', e.message);
  }

  // Master data
  try {
    console.log('-- Testing getRoles --');
    const roles = await api.getRoles();
    console.log('✅ getRoles:', roles.length);
  } catch (e) {
    console.error('❌ getRoles failed:', e);
  }

  try {
    console.log('-- Testing getDistricts --');
    const districts = await api.getDistricts();
    console.log('✅ getDistricts:', districts.length);
    if (districts.length) {
      const blocks = await api.getBlocksByDistrict(districts[0].districtId);
      console.log('✅ getBlocksByDistrict:', blocks.length);
    }
  } catch (e) {
    console.error('❌ Geography masters failed:', e);
  }

  // SHG pagination test
  console.log('-- Testing SHG pagination (pages 1-5) --');
  for (let p = 1; p <= 5; p++) {
    try {
      const shg = await api.getShgMembers(p, 10);
      console.log(`✅ SHG page ${p}:`, shg.rows?.length || 0, 'rows, total:', shg.totalCount);
    } catch (e) {
      console.error(`❌ SHG page ${p} failed:`, e.message);
    }
  }

  // Other APIs
  try {
    console.log('-- Testing getReports --');
    const reports = await api.getReports();
    console.log('✅ getReports:', reports.length);
  } catch (e) {
    console.error('❌ getReports failed:', e);
  }

  console.log('🧪 API test complete!');
};

testAllApis();
