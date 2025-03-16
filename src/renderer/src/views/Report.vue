<template>
    <div class="report-container">
        <iframe src="http://localhost:8501" frameborder="0" class="embedded-page"></iframe>
    </div>
</template>

<script lang="ts" setup>
// 如果不需要额外的逻辑，这里可以为空
</script>

<style scoped>
.report-container {
    width: 100%;
    height: 100vh;
    /* 根据需要调整高度 */
    overflow: hidden;
}

.embedded-page {
    width: 100%;
    height: 100%;
    border: none;
}
</style>
