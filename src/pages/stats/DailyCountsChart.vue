<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import { computed } from 'vue'
import { format, parse } from 'date-fns'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, annotationPlugin)

type ChartDataPoint = {
  date: string
  count: number
}

const props = defineProps<{
  data: ChartDataPoint[]
  label: string
  goal?: number
}>()

const formatDateLabel = (dateStr: string) => {
  const date = parse(dateStr, 'yyyy-MM-dd', new Date())
  return format(date, 'MM/dd')
}

const chartData = computed(() => ({
  labels: props.data.map(point => formatDateLabel(point.date)),
  datasets: [
    {
      label: props.label,
      data: props.data.map(point => point.count),
      backgroundColor: props.data.map(point =>
        props.goal && point.count >= props.goal ? '#10b981' : '#2563eb'
      )
    }
  ]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const
    },
    annotation: props.goal ? {
      annotations: {
        goalLine: {
          type: 'line' as const,
          yMin: props.goal,
          yMax: props.goal,
          borderColor: '#10b981',
          borderWidth: 2,
          borderDash: [6, 6],
          label: {
            display: true,
            content: `Goal: ${props.goal}`,
            position: 'end' as const,
            backgroundColor: '#10b981'
          }
        }
      }
    } : {}
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    }
  }
}))
</script>

<template>
  <div
    class="w-full max-w-full"
    style="height: 300px"
  >
    <Bar
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>
