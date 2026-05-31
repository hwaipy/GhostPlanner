<template>
  <div class="gp-login">
    <div class="gp-login__card">
      <div class="gp-login__brand">
        <q-icon name="workspaces" size="40px" color="primary" />
        <div class="gp-login__title">Ghost Planner</div>
        <div class="gp-login__sub">{{ setupMode ? 'Create your password' : 'Sign in' }}</div>
      </div>

      <q-form @submit="submit" class="q-gutter-md">
        <q-input v-model="user" label="Username" outlined dense autocomplete="username" :disable="busy" />
        <q-input
          v-model="password"
          :label="setupMode ? 'New password' : 'Password'"
          type="password"
          outlined
          dense
          autocomplete="current-password"
          :disable="busy"
        />
        <q-banner v-if="error" dense class="text-negative bg-red-1 rounded-borders">{{ error }}</q-banner>
        <q-btn type="submit" :label="setupMode ? 'Create & continue' : 'Sign in'" color="primary" unelevated class="full-width" :loading="busy" />
      </q-form>

      <div v-if="checking" class="gp-login__sub q-mt-md">Connecting…</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { authConfigured, login, setupPassword } from '../core/auth';

const user = ref('hwaipy');
const password = ref('');
const error = ref('');
const busy = ref(false);
const checking = ref(true);
const setupMode = ref(false);

onMounted(async () => {
  try {
    setupMode.value = !(await authConfigured());
  } catch {
    error.value = 'Cannot reach the server.';
  } finally {
    checking.value = false;
  }
});

async function submit() {
  if (busy.value) return;
  error.value = '';
  busy.value = true;
  try {
    if (setupMode.value) await setupPassword(user.value.trim(), password.value);
    else await login(user.value.trim(), password.value);
  } catch (e: any) {
    error.value = e.message || 'Failed';
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.gp-login {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gp-bg);
  padding: 20px;
}
.gp-login__card {
  width: 100%;
  max-width: 360px;
  background: var(--gp-row);
  border-radius: 16px;
  padding: 28px 22px;
}
.gp-login__brand {
  text-align: center;
  margin-bottom: 22px;
}
.gp-login__title {
  font-size: 22px;
  font-weight: 800;
  margin-top: 8px;
  color: var(--gp-text);
}
.gp-login__sub {
  color: var(--gp-text-2);
  font-size: 14px;
  margin-top: 2px;
}
</style>
