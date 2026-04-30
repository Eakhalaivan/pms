package com.pharmadesk.backend.pharmacy.controller;

import com.pharmadesk.backend.model.Medicine;
import com.pharmadesk.backend.model.MedicineStock;
import com.pharmadesk.backend.pharmacy.repository.MedicineRepository;
import com.pharmadesk.backend.pharmacy.repository.MedicineStockRepository;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.dto.MedicineDTO;
import com.pharmadesk.backend.pharmacy.mapper.MedicineMapper;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacy")
public class MedicineController {

    private final MedicineRepository medicineRepository;
    private final MedicineStockRepository stockRepository;
    private final MedicineMapper medicineMapper;
    private final com.pharmadesk.backend.service.EmailService emailService;
    private final com.pharmadesk.backend.repository.UserRepository userRepository;

    public MedicineController(MedicineRepository medicineRepository, 
                              MedicineStockRepository stockRepository, 
                              MedicineMapper medicineMapper,
                              com.pharmadesk.backend.service.EmailService emailService,
                              com.pharmadesk.backend.repository.UserRepository userRepository) {
        this.medicineRepository = medicineRepository;
        this.stockRepository = stockRepository;
        this.medicineMapper = medicineMapper;
        this.emailService = emailService;
        this.userRepository = userRepository;
    }

    @GetMapping("/medicines")
    public ResponseEntity<ApiResponse<List<MedicineDTO>>> getAllMedicines() {
        List<MedicineDTO> dtos = medicineRepository.findAll().stream()
                .map(medicine -> {
                    MedicineDTO dto = medicineMapper.toDto(medicine);
                    dto.setCurrentStock(stockRepository.findByMedicineId(medicine.getId()).stream()
                            .mapToInt(MedicineStock::getQuantityAvailable)
                            .sum());
                    return dto;
                })
                .toList();
        return ResponseEntity.ok(ApiResponse.success(dtos, "Medicines fetched successfully"));
    }

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','PHARMACY_STAFF')")
    @PostMapping("/medicines")
    public ResponseEntity<ApiResponse<Medicine>> createMedicine(@Valid @RequestBody Medicine medicine) {
        Medicine saved = medicineRepository.save(medicine);
        return ResponseEntity.ok(ApiResponse.success(saved, "Medicine added successfully"));
    }

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','PHARMACY_STAFF')")
    @PutMapping("/medicines/{id}")
    public ResponseEntity<ApiResponse<MedicineDTO>> updateMedicine(@PathVariable Long id, @Valid @RequestBody Medicine medicineData) {
        return medicineRepository.findById(id).map(medicine -> {
            medicine.setName(medicineData.getName());
            medicine.setGenericName(medicineData.getGenericName());
            medicine.setManufacturer(medicineData.getManufacturer());
            medicine.setCategory(medicineData.getCategory());
            medicine.setUnit(medicineData.getUnit());
            medicine.setHsnCode(medicineData.getHsnCode());
            medicine.setTaxPercentage(medicineData.getTaxPercentage());
            medicine.setReorderLevel(medicineData.getReorderLevel());
            Medicine updated = medicineRepository.save(medicine);
            
            MedicineDTO dto = medicineMapper.toDto(updated);
            dto.setCurrentStock(stockRepository.findByMedicineId(updated.getId()).stream()
                    .mapToInt(MedicineStock::getQuantityAvailable)
                    .sum());
            
            return ResponseEntity.ok(ApiResponse.success(dto, "Medicine updated successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/medicines/search")
    public ResponseEntity<List<MedicineDTO>> searchMedicines(@RequestParam String name) {
        List<MedicineDTO> dtos = medicineRepository.findByNameContainingIgnoreCase(name).stream()
                .map(medicine -> {
                    MedicineDTO dto = medicineMapper.toDto(medicine);
                    dto.setCurrentStock(stockRepository.findByMedicineId(medicine.getId()).stream()
                            .mapToInt(MedicineStock::getQuantityAvailable)
                            .sum());
                    return dto;
                })
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/stocks/search")
    public ResponseEntity<List<MedicineStock>> searchStocks(@RequestParam String name) {
        return ResponseEntity.ok(stockRepository.findByMedicineNameContainingIgnoreCase(name));
    }

    @GetMapping("/stocks/barcode/{barcode}")
    public ResponseEntity<ApiResponse<MedicineStock>> getStockByBarcode(@PathVariable String barcode) {
        return medicineRepository.findByBarcode(barcode)
                .flatMap(medicine -> stockRepository.findByMedicineId(medicine.getId()).stream()
                        .filter(s -> s.getQuantityAvailable() > 0)
                        .findFirst())
                .map(stock -> ResponseEntity.ok(ApiResponse.success(stock, "Stock found")))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stocks")
    public ResponseEntity<ApiResponse<List<MedicineStock>>> getAllStocks() {
        return ResponseEntity.ok(ApiResponse.success(stockRepository.findAll(), "Stocks fetched successfully"));
    }

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','PHARMACY_STAFF')")
    @PostMapping("/stocks")
    public ResponseEntity<ApiResponse<MedicineStock>> addStock(@Valid @RequestBody MedicineStock stock) {
        // Ensure medicine is linked
        if (stock.getMedicine() != null && stock.getMedicine().getId() != null) {
            Medicine medicine = medicineRepository.findById(stock.getMedicine().getId())
                    .orElseThrow(() -> new RuntimeException("Medicine not found"));
            stock.setMedicine(medicine);
        }
        MedicineStock saved = stockRepository.save(stock);
        return ResponseEntity.ok(ApiResponse.success(saved, "Stock updated successfully"));
    }
}
