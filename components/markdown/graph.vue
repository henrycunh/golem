<script lang="ts">
import { Component } from 'nuxt/schema'
import { Line } from 'vue-chartjs'

@Component({
    components: {
        LineChart: Line,
    },
})
export default class Graph extends Vue {
    chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'], // Exemple de libellés pour l'axe des x
        datasets: [
            {
                label: 'Example Data',
                backgroundColor: 'rgba(75,192,192,0.2)',
                borderColor: 'rgba(75,192,192,1)',
                data: [65, 59, 80, 81, 56], // Exemple de données pour l'axe des y
            },
        ],
    }

    chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
    }
}
</script>

<template>
    <div>
        <line-chart :data="chartData" :options="chartOptions" />
    </div>
</template>

<style scoped>
/* Vos styles CSS ici */
</style>
