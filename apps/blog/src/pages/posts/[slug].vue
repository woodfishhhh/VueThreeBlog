<script setup lang="ts">
import PostView from "~/views/PostView.vue";

definePageMeta({
  name: "post",
  middleware: ["resolve-post-slug"],
});
</script>

<template>
  <PostView />
</template>
